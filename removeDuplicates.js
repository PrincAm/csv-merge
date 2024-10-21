import fs from 'fs';
import csv from 'csv-parser';

// Define file path for the input CSV file
const inputFile = 'path-to-csv';

// Function to read CSV, remove duplicates, and print the unique domains
const printUniqueDomains = () => {
  return new Promise((resolve, reject) => {
    const uniqueDomains = new Set();

    // Check if input file exists before processing
    if (!fs.existsSync(inputFile)) {
      return reject(`Input file '${inputFile}' does not exist.`);
    }

    // Read the CSV file
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', (row) => {
        const domain = row.Domain?.trim().toLowerCase();
        if (domain && !uniqueDomains.has(domain)) {
          uniqueDomains.add(domain);
        }
      })
      .on('end', () => {
        // Print the unique domains
        if (uniqueDomains.size > 0) {
          console.log('Unique domains:');
          uniqueDomains.forEach(domain => console.log(domain));
          console.log(`\nTotal unique domains: ${uniqueDomains.size}`);
        } else {
          console.log('No unique domains found or input file is empty.');
        }
        resolve();
      })
      .on('error', (error) => reject(`Error reading file: ${error.message}`));
  });
};

// Run the function to print unique domains
printUniqueDomains()
  .then(() => console.log('Processing complete.'))
  .catch(error => console.error('Error:', error));