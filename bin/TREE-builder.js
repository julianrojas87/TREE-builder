const fs = require('fs');
const readline = require('readline');
const { NGramTreeManager, PrefixTreeManager } = require("linkeddatatree");
var program = require('commander');

program
    .option('--treePath <treePath>', 'Folder path where the tree will be stored')
    .option('--treeName <treeName>', 'Name of the tree')
    .option('--suffix', 'Create a suffix TREE instead of a prefix one')
    .parse(process.argv);


async function generate() {
    if (!program.treePath || !program.treeName) {
        console.error('Provide valid --treePath and --treeName');
        process.exit(1);
    }

    // TREE params
    const t0 = new Date();
    const rootDir = program.treePath;
    const dataDir = program.treeName + '/';
    const treePath = "https://w3id.org/openstreetmap/terms#name";
    const memoryLimit = 1000000;
    const fragmentSize = 100;
    const context = {
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
        "osm": "https://w3id.org/openstreetmap/terms#",
        "geosparql": "http://www.opengis.net/ont/geosparql#",
        "name": { "@id": "osm:name" },
        "osm:wikidata": { "@type": "@id" },
        "asWKT": { "@type": "geosparql:wktLiteral", "@id": "geosparql:asWKT" },
        "lat": { "@type": "xsd:double", "@id": "geo:lat" },
        "long": { "@type": "xsd:double", "@id": "geo:long" },
        "osm:class": { "@type": "@id" },
        "osm:boundary": { "@type": "@id" },
        "osm:place": { "@type": "@id" },
        "osm:highway": { "@type": "@id" },
        "osm:waterway": { "@type": "@id" },
        "osm:multiple": { "@type": "@id" },
        "osm:natural": { "@type": "@id" },
        "osm:landuse": { "@type": "@id" }
    }
    let tree = null;

    if (program.suffix) {
        if (fs.existsSync(`${rootDir}/${dataDir}/config.json`)) {
            tree = new NGramTreeManager().readTree(`${rootDir}/${dataDir}/config.json`)
        } else {
            tree = new NGramTreeManager().createTree({
                rootDir,
                dataDir,
                treePath,
                fragmentSize,
                memoryLimit,
                context
            });
        }
    } else {
        if (fs.existsSync(`${rootDir}/${dataDir}/config.json`)) {
            tree = new PrefixTreeManager().readTree(`${rootDir}/${dataDir}/config.json`);
        } else {
            tree = new PrefixTreeManager().createTree({
                rootDir,
                dataDir,
                treePath,
                fragmentSize,
                memoryLimit,
                context
            });
        }
    }

    const dataStream = readline.createInterface({
        input: process.stdin,
        crlfDelay: Infinity
    });

    for await (const d of dataStream) {
        const data = JSON.parse(d);
        const name = data['name'];
        console.log(`Adding entity to OSM tree: ${name}`);
        tree.addData(name, data);
    }

    tree.doneAdding();
    console.log(`OSM Tree created in ${new Date() - t0} ms`);
}

generate();