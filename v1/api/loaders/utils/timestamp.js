function generateTimestamp() {
    const now = new Date();

    const SS = String(now.getSeconds()).padStart(2, "0");
    const MM = String(now.getMinutes()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const MO = String(now.getMonth() + 1).padStart(2, "0");
    const YYYY = String(now.getFullYear());

    return `${SS}${MM}${HH}${DD}${MO}${YYYY}`;
}

module.exports = generateTimestamp;
