import fs from 'fs';
import csv from 'csv-parser';

// Define file paths for both CSV files
const newList = './path-to-csv';
const oldList = './path-to-csv';

// Function to read CSV file and extract domains into a Set
const readCSV = (filePath, columnName) => {
    return new Promise((resolve, reject) => {
        const domains = new Set();
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row[columnName]) {
                    domains.add(row[columnName].trim().toLowerCase());
                }
            })
            .on('end', () => resolve(domains))
            .on('error', (error) => reject(error));
    });
};

// Function to compare domains between the two CSV files
const compareDomains = async () => {
    try {
        // Read the DOMAIN column from the PlatinumLoydsFile
        const newListDomains = await readCSV(oldList, 'Vendor');

        // Read the Domain column from the Lloyds vendors file
        const oldListDomains = await readCSV(newList, 'COMPANY');

        // Find domains in PlatinumLoyds that are not in Lloyds Vendors
        const difference = [...newListDomains].filter(domain => !oldListDomains.has(domain));

        console.log('Domains in new list but not in old list:');
        difference.forEach(domain => console.log(domain));

    } catch (error) {
        console.error('Error reading files:', error);
    }
};

// Run the comparison
compareDomains();