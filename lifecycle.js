import fs from 'fs';
import csv from 'csv-parser';

// Path to the CSV file
const csvFilePath = 'path-to-csv';

// Customer ID
const customerId = 'customer-id';

// Array to store the domains
const assessDomains = [];

// Function to chunk an array into smaller arrays of a specified size
function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

// Read the CSV file and process the domains
fs.createReadStream(csvFilePath)
    .pipe(csv({ headers: false, skipEmptyLines: true }))
    .on('data', (row) => {
        const domain = row[0].trim();
        if (domain) {
            assessDomains.push(domain);
        }
    })
    .on('end', () => {
        // Split the domains into chunks of 150 domains each
        const domainChunks = chunkArray(assessDomains, 150);

        // Write each chunk to a separate JSON file
        domainChunks.forEach((chunk, index) => {
            const jsonData = {
                vendors: chunk.map(domain => ({
                    domain: domain,
                    customer_id: customerId
                })),
                lifecycle: 'assess',
                custom_tags: []
            };

            // Write the JSON data to a file with a numbered name
            const outputFilePath = `assess_vendors_part_${index + 1}.json`;
            fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 4), 'utf-8');

            console.log(`JSON file has been created at: ${outputFilePath}`);
        });

        console.log('All JSON files have been created.');
    })
    .on('error', (error) => {
        console.error('Error reading the CSV file:', error);
    });