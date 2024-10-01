import fs from 'fs';
import Papa from 'papaparse';

// Function to determine the tier based on the file name
function getTierFromFileName(filePath) {
    const lowerFilePath = filePath.toLowerCase();
    if (lowerFilePath.includes('platinum')) return "platinum";
    if (lowerFilePath.includes('gold')) return "gold";
    if (lowerFilePath.includes('silver')) return "silver";
    return null; // In case there is no matching keyword
}

// Function to load CSV files and parse them, adding tier information
function loadCSV(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const tier = getTierFromFileName(filePath);
        const data = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true
        }).data;

        return data.map(row => ({ ...row, Tier: tier }));
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return [];
    }
}

// Load and merge CSV files, adding tier information
const csvFiles = [
    './data/example/Platinum-test.csv',
    './data/example/Silver-test.csv',
    './data/example/Silver-test.csv'
];
let mergedData = csvFiles.flatMap(loadCSV);

// Load business impact data
const businessImpactData = loadCSV('./data/example/AllCompanies-filtered.csv');

// Create Business Impact column by matching domains
const businessImpactMap = Object.fromEntries(
    businessImpactData.map(row => [row.domain, row.businessImpact])
);
mergedData = mergedData.map(row => ({
    ...row,
    "Business Impact": businessImpactMap[row.DOMAIN] || null
}));

// Remove duplicate domains, keeping the one with the highest tier
const tierPriority = { platinum: 3, gold: 2, silver: 1 };
const domainMap = {};

mergedData.forEach(row => {
    const domain = row.DOMAIN;
    if (!domainMap[domain] || tierPriority[row.Tier] > tierPriority[domainMap[domain].Tier]) {
        domainMap[domain] = row;
    }
});
const uniqueData = Object.values(domainMap);

// Function to map TAGS column and create new columns
function mapTagsAndCreateColumns(row) {
    // Define mappings
    const mappings = {
        likelihood: {
            "Breach Likelihood Assessment - Low": "low",
            "Breach Likelihood Assessment - Medium": "medium",
            "Breach Likelihood Assessment - High": "high",
            "Breach Likelihood Assessment - Critical": "critical"
        },
        status: {
            "Active engagement - Proactive": "trending_down",
            "Active engagement - Reactive": "needs_attention",
            "Active engagement - Escalation": "risk_escalating",
            "Active engagement - Breach": "active_breach"
        },
        lifecycle: {
            "Engagement lifecycle - Onboarding": "assess",
            "Engagement lifecycle - Assessment": "monitor",
            "Engagement lifecycle - Remediation": "respond",
            "Engagement lifecycle - Maintenance": "maintain"
        }
    };

    // Extract new columns based on TAGS
    let likelihood = null, status = null, lifecycle = null;

    if (row.TAGS) {
        const tags = row.TAGS.split(':');
        tags.forEach(tag => {
            if (mappings.likelihood[tag]) likelihood = mappings.likelihood[tag];
            else if (mappings.status[tag]) status = mappings.status[tag];
            else if (mappings.lifecycle[tag]) lifecycle = mappings.lifecycle[tag];
        });
    }

    return {
        ...row,
        Likelihood: likelihood,
        Status: status,
        Lifecycle: lifecycle
    };
}

// Apply mapping to add 'Likelihood', 'Status', and 'Lifecycle' columns
const mappedData = uniqueData.map(mapTagsAndCreateColumns);

// Function to rename and map the columns as specified, and remove extras
function mapColumns(row) {
    return {
        "Company Name": row.COMPANY,
        "Domain": row.DOMAIN,
        "Business Impact": row['Business Impact'],
        "Tier": row.Tier,
        "Likelihood": row.Likelihood,
        "Status": row.Status,
        "Custom Tags": "" // Empty field
    };
}

// Apply mapping to rename columns and remove extras
const finalData = mappedData.map(mapColumns);

// Save the final output to a CSV file
const csvOutput = Papa.unparse(finalData);
try {
    fs.writeFileSync('merged_output.csv', csvOutput);
    console.log('Mapped and filtered CSV file saved as "merged_output.csv"');
} catch (error) {
    console.error(`Error writing CSV file: ${error.message}`);
}