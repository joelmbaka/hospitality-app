// Use localStorage for web; could also export undefined for in-memory only
export default typeof localStorage === 'undefined' ? undefined : localStorage;
