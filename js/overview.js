addMdToPage(`
  ### Det finns mycket nytt och förbättrat i version 6!
  Läs om allt nytt och gammalt [i den inbyggda dokumentationen](/docs)!
`);

let students = await dbQuery('SELECT * FROM result LIMIT 5')

console.log(students)
tableFromData({ data: students });