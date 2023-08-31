/**
 * @fileOverview This file includes the implementation of the conversion of schema.org types(JSON-LD version) into JSON schema
 * @version 1.0.0
 * @license Apache-2.0
 * @author Pragya Bhardwaj
 */


// Import fs promises module for async file operations
import { constants, access, readFile, writeFile } from 'fs/promises';

const baseURL = "https://schema.org/";
const schemaTemplate = {};
let data, filteredData;
const userInput = process.argv[2];

// Extract title for the schema type or the property
const getTitle = (type) => {
    if(type['rdfs:label']['@value']){
        return type['rdfs:label']['@value'];
    }
    else{
        return type['rdfs:label']
    }
}

// Extract description for the schema type or the property
const getDescription = (type) => {
    if(type['rdfs:comment']['@value']){
        return type['rdfs:comment']['@value'];
    }
    else{
        return type['rdfs:comment']
    }
}

// Collate all of the enumeration values of an enum
const getEnumerations = (x) => {
    let enumArray =[];
    data['@graph'].forEach(item => {
        if(item['@id'] === x){
            if(item['@type'] === 'rdfs:Class' && item['rdfs:subClassOf'] && item['rdfs:subClassOf']['@id'] === 'schema:Enumeration'){
                enumArray = data['@graph'].filter(item => item['@type'] === x)
                .map(item => {
                    return item['rdfs:label'];
                })
            }
        }
    })
    return enumArray
}

// Data types' mapping from JSON-LD to JSON schema
const checkDataType = (x) => {
    const tempType = {};
    switch(x.join()){
        case "schema:Text" :
            tempType['type'] = "string";
            break;
        case "schema:Number": 
            tempType['type'] = "number";
            break;
        case "schema:DateTime": 
            tempType['type'] = "string";
            tempType['format'] = "date";
            break;
        case "schema:Time":
            tempType['type'] = "string";
            tempType['format'] = "date-time";
            break;
        case "schema:Boolean": 
            tempType['type'] = "boolean";
            break;
        case "schema:Date":
            tempType['type'] = "string";
            tempType['format'] = "date";
            break;
        case "schema:Integer": "integer"
            tempType['type'] = "integer";
            break;
        default:
            const allEnums = getEnumerations(x.join())
            allEnums.length?
                tempType['enum'] = allEnums:
                tempType['schemaType'] = x.toString();
    }
    return tempType;
} 

/**
 * 
 * @param {object} schemaProperties an array of properties of a schema type
 * @returns {object} properties an object consists of property name and its type 
 */

const getPropertyType = (schemaProperties) => {
    let properties = {};
    let propertyType;
    schemaProperties.forEach(prop => {
        properties[prop['rdfs:label']] ={};
        properties[prop['rdfs:label']]['description'] = getDescription(prop);
        
        // If rangeIncludes contain more than 1 data types
        if(Array.isArray(prop['schema:rangeIncludes'])){
            properties[prop['rdfs:label']]['oneOf'] =[];
            prop['schema:rangeIncludes'].forEach(item => {
                propertyType = checkDataType(Object.values(item));
                if(Object.keys(propertyType).length !== 0){
                    properties[prop['rdfs:label']]['oneOf'].push(propertyType);
                }
            })
        }
        else{
            propertyType = checkDataType(Object.values(prop['schema:rangeIncludes']))
            properties[prop['rdfs:label']] = {...properties[prop['rdfs:label']], ...propertyType};
        }
    })
    return properties;
}

/**
 * 
 * @param {string} typeName name of the schema type
 * @returns 
 */

const getProperties = (typeName, filteredData) => {
    const schemaProperties = filteredData.filter(item => {
        const domainIncludes = item['schema:domainIncludes'];
        if(item['@type'] == 'rdf:Property'){
            if(Array.isArray(domainIncludes)){
                return domainIncludes.some(item => item['@id'] === typeName);
            }
            else {
                return domainIncludes && domainIncludes['@id'] === typeName;
            }
        }
    })
    return getPropertyType(schemaProperties);
}

/**
 * @function getJSONschema
 * @param {object} type schema type 
 */

const getJSONschema = (type, filteredData) => {
    const schemaTypeLabel = getTitle(type);
    const schemaTypeDescription = getDescription(type);

    schemaTemplate['title'] = schemaTypeLabel;
    schemaTemplate['description'] = schemaTypeDescription;

    if(type['rdfs:subClassOf']){
        schemaTemplate['allOf'] = [];
        // If the current type is subclass of more than 1 classes
        if(Array.isArray(type['rdfs:subClassOf'])){
            type['rdfs:subClassOf'].forEach(item => {
                schemaTemplate.allOf.push({'super':Object.values(item).toString()})
            })
        }
        else{
            schemaTemplate.allOf.push({"super":type['rdfs:subClassOf']['@id'].toString()})
        }
    } 
    
    schemaTemplate['type'] = 'object'
    schemaTemplate['properties'] = getProperties(type['@id'], filteredData)
    return schemaTemplate;
}

// Add the JSON schema generated in a collated schemas' file
const saveJSONSchema = async (typeName) => {
    const schemaVersion = {"$schema": "https://json-schema.org/draft/2020-12/schema"};
    const updatedContent = Object.assign({},schemaVersion, schemaTemplate );
    try{
        const promise = writeFile(userInput === 'All' ? `./OutputFiles/${typeName}.json`: `./SingularOutputFiles/${typeName}.json`, JSON.stringify(updatedContent));
        await promise;
    }
    catch(err){
        console.log(err);
    }

}

// Remove deprecated and meta schema org terms
const filterData = async(data) => {
        return data['@graph'].filter((item) => {
        const notSuperseded = !item['schema:supersededBy'];
        const notMetaSchema = !item['schema:isPartOf'] || (item['schema:isPartOf']['@id'] !== 'https://meta.schema.org')
        return notSuperseded && notMetaSchema;
    })
};

// Initial step to process the user input and filter all the schema org types, build JSON schema for every schema org type
const main = async () => {
    
    const checkFileAccess = async (fileReference) => {
        try {
            await access(fileReference, constants.R_OK);
            return true;
        } catch(error) {            
            return false;
        }
    };
    const getFileData = async(fileReference) => {
        try{
            if(checkFileAccess(fileReference)){
                const fileData = await readFile(fileReference, 'utf8');
                return JSON.parse(fileData);
            }
            else{
                return null;
            }
        }
        catch(error) {
            if(error.code === 'ENOENT'){
                console.log('Error: JSON-LD file not present at ' + fileReference + '.\nPlease add JSON-LD file to convert the schema types in JSON schema.');
            } else{
                console.error('There is some error occured: ', error);
            }
            return false;
        }
    }
    if (userInput === 'All') {
        data = await getFileData('./InputFiles/schemaorg-current-https.jsonld');
    } else {
        data = await getFileData('./InputFiles/' + `${userInput}` + '.jsonld');
    }

    if(!data){
        console.error('File data not available');
        return;
    }

    filteredData = await filterData(data);

    const schemaTypes = filteredData.filter(item => {
        const isRdfsClass = item['@type'] === 'rdfs:Class';
        const hasSubClass = item['rdfs:subClassOf'];
        return isRdfsClass && (hasSubClass ? item['rdfs:subClassOf']['@id'] !== 'schema:Enumeration': item) ;
    })

// For every schema type, fetch the JSON schema and save it
    schemaTypes.forEach(type => {
        getJSONschema(type, filteredData);
        saveJSONSchema(getTitle(type));
    });
// Output file location
    userInput === 'All' ? console.log('Output JSON schema files are at this location: schema-org-openapi-catalog/OutputFiles/') 
    : console.log('Output JSON schema file is present at this location: schema-org-openapi-catalog/SingularOutputFiles/');
};

main();