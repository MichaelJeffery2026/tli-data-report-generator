import AdmZip from "adm-zip"; 
import logger from "./logger.js";

export async function unzip(item) {
    try {
        const ab = await item.arrayBuffer();
        const buf = Buffer.from(ab);
        const zip = new AdmZip(buf);
        const entries = zip.getEntries();
        const entry = entries.find(e => /responses\.json$/i.test(e.entryName)) || entries.find(e => /\.json$/i.test(e.entryName));
        return JSON.parse(zip.readAsText(entry));
    } catch (err) {
        logger.error(`unzip failed: ${err.message}`, { stack: err.stack });
        throw err;
    }
}
