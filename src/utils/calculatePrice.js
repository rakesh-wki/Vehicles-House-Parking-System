module.exports = function calculatePrice(startTime, endTime, priceHour, priceDay) {
const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
const hours = Math.ceil(ms / (1000 * 60 * 60));
if (hours < 24) return hours * priceHour;
const days = Math.ceil(hours / 24);
return days * priceDay;
};