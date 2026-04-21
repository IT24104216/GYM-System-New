export const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  return (hours * 60) + minutes;
};

export const isEndAfterStart = (startTime, endTime) =>
  timeToMinutes(endTime) > timeToMinutes(startTime);

export const toLocalIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isPastSlot = (date, todayIso) => date < todayIso;

export const hasStartTimePassedForToday = (date, startTime, now = new Date()) => {
  const todayIso = toLocalIsoDate(now);
  if (date !== todayIso) return false;
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  return timeToMinutes(startTime) <= nowMinutes;
};

export const hasTimeOverlap = (candidateStart, candidateEnd, currentStart, currentEnd) =>
  timeToMinutes(candidateStart) < timeToMinutes(currentEnd)
  && timeToMinutes(currentStart) < timeToMinutes(candidateEnd);
