// The file contains only 
const data = require('./bookJSONLD.json');
const baseURL = "https://schema.org/";
const schemaTemplate = {
};

// Data types' mapping from JSON-LD to JSON schema
const dataTypesMapping = {
    "schema:Text": "string",
    "schema:Number": "number",
    "schema:DateTime": "string",
    "schema:Time": "string",
    "schema:Boolean": "boolean",
    "schema:Date": "string",
    "schema:Integer": "integer"
}

// Filter out all of the schema types present in the file data
schemaTypes = data['@graph'].filter(item => {
    return item['@type'] == 'rdfs:Class';
})

/**
 * 
 * @param {object} schemaProperties an array of properties of a schema type
 * @returns {object} properties an object consists of property name and its type 
 */

const getPropertyType = (schemaProperties) => {
    let properties = {};
    schemaProperties.forEach(prop => {
        properties[prop['rdfs:label']] ={};
        properties[prop['rdfs:label']]['description'] = prop['rdfs:comment'];
        
        // If rangeIncludes contain more than 1 data types
        if(Array.isArray(prop['schema:rangeIncludes'])){
            prop['schema:rangeIncludes'].forEach(item => {
                if(Object.values(item) in dataTypesMapping){                 // Check if the rangeIncludes is one of the basic data types
                    properties[prop['rdfs:label']]['type'] = dataTypesMapping[Object.values(item)];
                }
                else{
                    console.log('RangeInclude contain another Schema type');
                }
            })
        }
        else{
            if(Object.values(prop['schema:rangeIncludes']) in dataTypesMapping){
                properties[prop['rdfs:label']]['type'] = dataTypesMapping[Object.values(prop['schema:rangeIncludes'])];
            }
            else{
                console.log('RangeInclude contain another Schema type');
            }
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
        return (item['@type'] == 'rdf:Property' && domainIncludes['@id'] ==  typeName);
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
}

// Add the JSON schema generated in a collated schemas' file
const saveJSONSchema = () => {
    const fs = require('fs');
    const file = fs.readFileSync('outputSchemas.json')
    if (file.length == 0) {
        const schemaVersion = {"$schema": "https://json-schema.org/draft/2020-12/schema"};
        const updatedContent = Object.assign({},schemaVersion, schemaTemplate )
        try{
            fs.writeFileSync("outputSchemas.json", JSON.stringify(updatedContent));
            console.log("JSON schema saved in the output file");
        }
        catch(err){
            console.log(err);
        }
    } else {
        var fileContent = JSON.parse(file);
        var updatedContent = Object.assign({}, fileContent, schemaTemplate);
        try{
            fs.writeFileSync("outputSchemas.json", JSON.stringify(updatedContent));
            console.log("JSON schema saved in the output file");
        }
        catch(err){
            console.log(err);
        }
    }
}
// For every schema type, fetch the JSON schema and save it
schemaTypes.forEach(type => {
    getJSONschema(type);
    saveJSONSchema()
});

