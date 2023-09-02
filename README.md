
# Schema.Org OpenAPI Catalog
## Project Overview
It creates an open catalog of OpenAPI definitions for each of the Schema.org Types. Providing a robust set of starting OpenAPI templates for teaching or developing new APIs using a design-first approach. 

It helps save developer's work when it comes to starting new APIs, but also help ensure APIs are developed using common standards and are as interoperable as possible.

<br/>


> **_NOTE:_** This project has been a part of Google Summer of Code (GSoC) 2023.

**This project unfolds in two key steps:**

1. **Generate JSON Schema:** Begin by transforming the JSON-LD version of **[Schema.org](https://schema.org/)** types into JSON schemas.
2. **Convert to OpenAPI Definitions:** Subsequently, convert the generated JSON schemas into comprehensive OpenAPI definitions.

<br/>
Progress so far includes the successful creation of JSON schemas for all **[Schema.org](https://schema.org/)** types, with the exception of referring other [schema.org](http://schema.org) types, which is still being worked on. 

All the [schema.org](http://schema.org) types get derived from some or the other schema.org type (except Thing) and their properties also refer to other schema.org types for which these keywords included: “super” and “schemaType” respectively to represent but this will be converted into references soon.

<br/>

**Mentors:** @MikeRalphson, @sourabhbagrecha, @saialekhya-001 and @kulnor

**Project Repo:** postman-open-technologies/schema-org-openapi-catalog

**Skills:** Familiarity with the OpenAPI specification, JSON Schema, and Schema.org Types.


## Usage
This project can be used in 2 ways:

1. **Convert All [Schema.org](https://schema.org/) Types:** To convert all **[Schema.org](https://schema.org/)** types from the latest version, simply execute the following command in your terminal:
    
    ```
    node schemaGenerator All
    
    ```
    
2. **Convert a Specific Schema Type:** If you're interested in converting a specific **[Schema.org](https://schema.org/)** type, such as "Book," follow these steps:
    *  Upload the complete JSON-LD file for the targeted **[Schema.org](https://schema.org/)** type (e.g., Book) to the "InputFiles" directory.
    *  Run the following command:
        
        ```
        node schemaGenerator <schema.org type name>
        
        ```
        

After the code execution completes successfully, you'll find the generated JSON schema files in the designated output folders:

- For all types: "OutputFiles" directory
- For a specific type: "SingularOutputFiles" directory



## Ongoing Development
1. **Referencing:** 
    * Properties refer to other [schema.org](http://schema.org) type and their properties 
    * [schema.org](http://schema.org) types get derived from other schema.org types
2. **OpenAPI Conversion:** Converting the JSON schemas into OpenAPI definitions.



## Versions
- [schema.org](http://schema.org) : Release - 22.0 ([View release](https://github.com/schemaorg/schemaorg/blob/main/data/releases/22.0/schemaorg-current-https.jsonld))
- JSON Schema: Draft 2020-12 ([View release](https://json-schema.org/specification-links.html#:~:text=Published))


## References
* https://schema.org/
* https://github.com/schemaorg/schemaorg
* https://github.com/OAI/OpenAPI-Specification
* https://oai.github.io/Documentation/
* https://json-schema.org/
* https://json-schema.org/understanding-json-schema/
* https://json-schema.org/implementations.html




## 

