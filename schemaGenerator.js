import { constants, access, readFile, writeFile } from 'fs/promises'; // Import fs promises module for async file operations

const baseURL = "https://schema.org/";
const schemaTemplate = {};
let data;
const userInput = process.argv[2];


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
            console.log('RangeInclude contain another Schema type');
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
        properties[prop['rdfs:label']]['description'] = prop['rdfs:comment'];
        
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

const getProperties = typeName => {
    const schemaProperties = data['@graph'].filter(item => {
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

const getJSONschema = type => {
    schemaTemplate['$id'] = baseURL+type['rdfs:label']+'.json'
    schemaTemplate['title'] = type['rdfs:label'];
    console.log(type['rdfs:label'])
    schemaTemplate['description'] = type['rdfs:comment']
    if(type['rdfs:subClassOf']){
        schemaTemplate['allOf'] = [];
        // If the current type is subclass of more than 1 classes
        if(Array.isArray(type['rdfs:subClassOf'])){
            type['rdfs:subClassOf'].forEach(item => {
                schemaTemplate.allOf.push({'$ref':Object.values(item)+'.json'})
            })
        }
        else{
            schemaTemplate.allOf.push({'$ref':Object.values(type['rdfs:subClassOf'])+'.json'})
        }
    }
    schemaTemplate['type'] = 'object'
    schemaTemplate['properties'] = getProperties(type['@id'])
    return schemaTemplate;
}

// Add the JSON schema generated in a collated schemas' file
const saveJSONSchema = async (typeName) => {
    const schemaVersion = {"$schema": "https://json-schema.org/draft/2020-12/schema"};
    const updatedContent = Object.assign({},schemaVersion, schemaTemplate );
    try{
        const promise = writeFile(userInput === 'All schema org types' ? `./OutputFiles/${typeName}.json`: `./SingularOutputFiles/${typeName}.json`, JSON.stringify(updatedContent));
        await promise;
    }
    catch(err){
        console.log(err);
    }

}

// Initial step to process the user input and filter all the schema org types, build JSON schema for every schema org type
const main = async () => {
    const checkFileAccess = async (fileReference) => {
        try {
            await access(fileReference, constants.R_OK);
            console.log('Reference JSON-LD file found');
            return true;
        } catch {
            console.error('Reference JSON-LD file is missing!');
            return false;
        }
    };
    const getFileData = async(fileReference) => {
        if(checkFileAccess(fileReference)){
            const fileData = await readFile(fileReference, 'utf8');
            return JSON.parse(fileData);
        }
        else{
            return null;
        }
    }
    if (userInput === 'All schema org types') {
        data = await getFileData('./InputFiles/schemaorg-all-https.json', 'utf8');
    } else if (userInput) {
        data = await getFileData('./InputFiles/' + `${userInput}` + '.json', 'utf8');
    }

    if(!data){
        console.error('File data not available');
        return;
    }

    const schemaTypes = data['@graph'].filter(item => {
        return item['@type'] == 'rdfs:Class' && item['rdfs:subClassOf'] && item['rdfs:subClassOf']['@id'] !== 'schema:Enumeration';
    })
    
    console.log('Number of schema types--->>>', schemaTypes.length)

// For every schema type, fetch the JSON schema and save it
    schemaTypes.forEach(type => {
        getJSONschema(type);
        saveJSONSchema(type['rdfs:label']);
    });
};

main();