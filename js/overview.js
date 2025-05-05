// addMdToPage(`
//   ### Analyzing Mental Health Trends and Predictors Among Students
// `);


//Load the Dataset
let rawData = await dbQuery('SELECT * FROM result');

//check weird data 
let weirdValues = rawData.filter(student => {
  const age = parseFloat(student.Age);
  const city = student.City;
  const depression = parseInt(student.Depression);
  const academicPressure = parseFloat(student.AcademicPressure);
  const cgpa = parseFloat(student.CGPA);
  const financialStress = parseFloat(student.FinancialStress);
  const jobSatisfaction = parseFloat(student.JobSatisfaction);
  const studySatisfaction = parseFloat(student.StudySatisfaction);
  const workStudyHours = parseFloat(student["Work/StudyHours"]);
  const workPressure = parseFloat(student.WorkPressure);

  return (
    isNaN(age) ||
    isNaN(depression) ||
    isNaN(academicPressure) ||
    isNaN(cgpa) ||
    isNaN(financialStress) ||
    isNaN(jobSatisfaction) ||
    isNaN(studySatisfaction) ||
    isNaN(workStudyHours) ||
    isNaN(workPressure)
  );
}
);
//console.log('weird values', weirdValues);
//tableFromData({ data: weirdValues });




//data cleaning
const cleanedData = rawData.map(student => {
  return {
    age: parseFloat(student.Age),
    depression: parseInt(student.Depression),
    academicPressure: parseFloat(student.AcademicPressure),
    cgpa: parseFloat(student.CGPA),
    financialStress: parseFloat(student.FinancialStress),
    jobSatisfaction: parseFloat(student.JobSatisfaction),
    sleepTime: (() => {
      const map = {
        "'Less than 5 hours'": 4.5,
        "'5-6 hours'": 5.5,
        "'7-8 hours'": 7.5,
        "'More than 8 hours'": 8.5
      };
      return map[student.SleepDuration?.trim()] ?? null;
    })(),
    studySatisfaction: parseFloat(student.StudySatisfaction),
    workStudyHours: parseFloat(student["Work/StudyHours"]),
    workPressure: parseFloat(student.WorkPressure),
    suicidalThoughts: student["Have you ever had suicidal thoughts ?"] === "Yes" ? 1 : 0,
    familyHistory: student["Family History of Mental Illness"] === "Yes" ? 1 : 0,
    dietaryHabits: student.DietaryHabits?.toLowerCase(),
    gender: student.Gender?.toLowerCase(),
    profession: student.Profession,
    city: student.City,
    degree: student.Degree,
  };
});

// const class12Data = cleanedData.filter(student => student.degree === "'Class 12'");
// console.log('class12Data', class12Data);


//tableFromData({ data: class12Data.slice(0, 20) });

//console.log('cleaned data',cleanedData);
//tableFromData({ data: cleanedData });

// add degreeLevel column
const degreeToLevelMap = {
  "'Class 12'": 'HighSchool',
  'BA': 'Undergraduate',
  'BSc': 'Undergraduate',
  "B.Arch": "Undergraduate",
  'B.Com': 'Undergraduate',
  'B.Ed': 'Undergraduate',
  'B.Pharm': 'Undergraduate',
  'B.Tech': 'Undergraduate',
  'BBA': 'Undergraduate',
  'BCA': 'Undergraduate',
  'BE': 'Undergraduate',
  'BHM': 'Undergraduate',
  'LLB': 'Undergraduate',
  'MA': 'Postgraduate',
  'MSc': 'Postgraduate',
  'M.Com': 'Postgraduate',
  'M.Ed': 'Postgraduate',
  'M.Tech': 'Postgraduate',
  'MBA': 'Postgraduate',
  'MCA': 'Postgraduate',
  'ME': 'Postgraduate',
  'MHM': 'Postgraduate',
  'M.Pharm': 'Postgraduate',
  'LLM': 'Postgraduate',
  'MD': 'Postgraduate',
  'MBBS': 'Postgraduate',
  'PhD': 'Doctoral',
  'Others': 'Others'
};


const enrichedData = cleanedData.map(entry => ({
  ...entry,
  degreeLevel:degreeToLevelMap[entry.degree] || 'Unknown'
}));
//console.log('enrichedData',enrichedData.slice(0, 20));


// remove non-student data
let studentData = enrichedData.filter(student => student.profession === "Student");


// Age vs Depression
addMdToPage(`
  ## Age vs Depression
`);

// focus on age 18-34 by default
let ageRange = addDropdown('Age Range', ['all', '18-34'], '18-34');
let chartType = addDropdown('Chart Type', ['Number', 'Percentage'], 'Percentage');

let selectedAgeStudentData;
if (ageRange === 'all') {
  selectedAgeStudentData = studentData;
} else {
  selectedAgeStudentData = studentData.filter(item => item.age >= 18 && item.age <= 34);
}

const ageDepressionStat = {};

selectedAgeStudentData.forEach(student => {
  const age = student.age;
  const depression = student.depression; // 0 or 1

  if (!isNaN(age) && (depression === 0 || depression === 1)) {
    if (!ageDepressionStat[age]) {
      ageDepressionStat[age] = { depressed: 0, notDepressed: 0 };
    }
    if (depression === 1) {
      ageDepressionStat[age].depressed += 1;
    } else {
      ageDepressionStat[age].notDepressed += 1;
    }
  }
});

//console.log('ageDepressionStat', ageDepressionStat);
// change to array for chart
const ageDepressionArray = Object.entries(ageDepressionStat)
  .map(([age, counts]) => ({
    age: parseInt(age),
    depressed: counts.depressed,
    notDepressed: counts.notDepressed,
    total: counts.depressed + counts.notDepressed,
    depressedRate: (counts.depressed / (counts.depressed + counts.notDepressed)) * 100 
  }))
  .sort((a, b) => a.age - b.age);

//tableFromData({ data: ageDepressionArray});

// column chart of number of depresed students 
if (chartType === 'Number') {
  let chartData = ageDepressionArray.map(item => {
    return {
      age: item.age,
      depressed: item.depressed,
      notDepressed: item.notDepressed,
    };
  }
  );
  drawGoogleChart({
    type: 'ColumnChart',
    data: makeChartFriendly(chartData, 'age', 'depressed', 'notDepressed'),
    options: {
      height: 500,
      // chartArea: { left: 100, right: 100 },
      hAxis: {
        title: 'Age'
      },
      vAxis: {
        title: 'Number of students',
        format: '###',
        minValue: 0
      },
      isStacked: true,
      //legend: { position: 'top' },
      colors: ['#e2431e','blue'],
      title: 'Number of depressed and non-depressed people aged 18–34'
    }
  });
}



const ageDepressionRateDataForChart = [
  ['Age', 'Depression Rate', { role: 'annotation' }],
  ...ageDepressionArray
    //.filter(item => item.total > 100)
    .map(item => {
      const rate = (item.depressed / item.total) * 100;
      return [item.age, rate, rate.toFixed(1) + '%'];
    })
];

//tableFromData({ data: ageDepressionRateDataForChart });

if (chartType === 'Percentage') {
  //ColumnChart for percentage of depressed students
  drawGoogleChart({
    type: 'ColumnChart',
    data: ageDepressionRateDataForChart,
    options: {
      height: 500,
      annotations: {
        alwaysOutside: true,
        textStyle: {
          fontSize: 12,
          color: '#000000', 
          auraColor: 'none'
        }
      },
      vAxis: {
        title: 'Depression Rate (%)',
        format: '#\'%\'',
        minValue: 0,
        maxValue: 80
      },
      hAxis: {
        slantedText: true,
        slantedTextAngle: 45,
      },
      legend: "none",
      chartArea: { left: 100,right:50},
      colors: ['#e2431e'],
      title: 'students depression rate by age'
    }
  });
}
addMdToPage(`
  **Summary**
  * Depression rates are highest among young adults (18–21), with rates above 67%.
  * The depression rate among students aged 22–29 is slightly lower, at around 60%.
  * By age 30+, depression rates drop significantly, most notably below 50% after age 30.
  
  **Possible Interpretation**
  * The data suggests that younger students (late teens to early twenties) experience higher levels of depression.
  * Emotional maturity, life stability, or career progression might contribute to lower depression rates in older age groups.
`);




// Gender vs Depression
addMdToPage(`
  ---
  ## Gender vs Depression
`);

const genderDepressionStat = {};

selectedAgeStudentData.forEach(student => {
  const gender = student.gender; // Ensure gender is valid
  const depression = student.depression; // 0 or 1

  // Only process if gender is valid (either "male" or "female") and depression is valid
  if ((gender === 'male' || gender === 'female') && (depression === 0 || depression === 1)) {
    if (!genderDepressionStat[gender]) {
      genderDepressionStat[gender] = { depressed: 0, notDepressed: 0 };
    }
    if (depression === 1) {
      genderDepressionStat[gender].depressed += 1;
    } else {
      genderDepressionStat[gender].notDepressed += 1;
    }
  }
});
//console.log('genderDepressionStat', genderDepressionStat);

// Convert to array format for chart
const genderDepressionArray = Object.entries(genderDepressionStat)
  .map(([gender, counts]) => ({
    gender: gender,
    depressed: counts.depressed,
    notDepressed: counts.notDepressed,
  }));


//console.log('genderDepressionArray', genderDepressionArray);
tableFromData({ data: genderDepressionArray });


// //stackedColumnChart
// drawGoogleChart({
//   type: 'ColumnChart',
//   data: makeChartFriendly(genderDepressionArray, 'gender', 'depressed', 'notDepressed'),
//   options: {
//     height: 500,
//     // chartArea: { left: 100, right: 100 },
//     // hAxis: {
//     //   title: 'Age'
//     // },
//     vAxis: {
//       title: 'Number of students',
//       format: '###',
//       minValue: 0
//     },
//     isStacked: true,
//     //legend: { position: 'top' },
//     colors: ['#e2431e','blue'],
//     title: 'Number of depressed and non-depressed people aged 18–34'
//   }
// });

function convertToPieChartData(obj) {
  return [
    ['Status', 'Count'],
    ['Depressed', obj.depressed],
    ['Not Depressed', obj.notDepressed]
  ];
}
const femaleStats = genderDepressionArray.filter(item => item.gender === 'female')[0];
const femalePieChartData = convertToPieChartData(femaleStats);

const maleStats = genderDepressionArray.filter(item => item.gender === 'male')[0];
const malePieChartData = convertToPieChartData(maleStats);

//console.log('femaleStats', femaleStats);
//console.log('femalePieChartData', femalePieChartData);


drawGoogleChart({
  type: 'PieChart',
  data: malePieChartData,
  options: {
    height:300,
    width: 500,
    colors: ['#e2431e', 'blue'],
    title: 'Male Students Depression Rate',
  },
});

drawGoogleChart({
  type: 'PieChart',
  data: femalePieChartData,
  options: {
    height:300,
    width: 500,
    colors: ['#e2431e', 'blue'],
    title: 'Female Students Depression Rate',
  },
});

addMdToPage(`
  **Summary**
  *  Both male and female students show a fairly high depression rate, greater than 50%.
  * The depression rate among male students (58.6%) is slightly higher than the depression rate among female students (58.5%)
`);





//depressionrate by city
addMdToPage(`
  ---
  ## City Vs Depression
`);
const cityDepressionStat = {};  
selectedAgeStudentData.forEach(student => {
  const city = student.city; // Ensure city is valid
  const depression = student.depression; // 0 or 1

  // Only process if city is valid and depression is valid
  if (city && (depression === 0 || depression === 1)) {
    if (!cityDepressionStat[city]) {
      cityDepressionStat[city] = { depressed: 0, notDepressed: 0 };
    }
    if (depression === 1) {
      cityDepressionStat[city].depressed += 1;
    } else {
      cityDepressionStat[city].notDepressed += 1;
    }
  }
}); 
//console.log('cityDepressionStat', cityDepressionStat);

// Convert to array format for chart  
const cityDepressionArray = Object.entries(cityDepressionStat)
  .map(([city, counts]) => ({
    city: city,
    depressed: counts.depressed,
    notDepressed: counts.notDepressed,
    total: counts.depressed + counts.notDepressed,
    depressedRate: (counts.depressed / (counts.depressed + counts.notDepressed)) * 100
  })).sort((a, b) => b.total - a.total);
//console.log('cityDepressionArray', cityDepressionArray);

// keep cities with more than 100 students
// and sort by depression rate
const cityDepressionRateDataForChart = [
  ['City', 'Depression Rate', { role: 'annotation' }],
  ...cityDepressionArray
    .filter(item => item.total > 100)
    .map(item => {
      const rate = (item.depressed / item.total) * 100;
      return [item.city, rate, rate.toFixed(1) + '%'];
    })
    .sort((a, b) => b[1] - a[1])
];
//console.log('cityDepressionRateDataForChart', cityDepressionRateDataForChart);
//tableFromData({ data: cityDepressionRateDataForChart });

//ColumnChart  
drawGoogleChart({
  type: 'ColumnChart',
  data: cityDepressionRateDataForChart,
  options: {
    height: 500,
    annotations: {
      alwaysOutside: true,
      textStyle: {
        fontSize: 12,
        color: '#000000', // Draw text color
        // auraColor: 'none'
      }
    },
    vAxis: {
      title: 'Depression Rate (%)',
      format: '#\'%\'',
      minValue: 0,
      maxValue: 80
    },
    hAxis: {
      slantedText: true,
      slantedTextAngle: 45,
    },
    legend: "none",
    chartArea: { left: 100,right:50},
    colors: ['#e2431e'],
    title: 'students depression rate by city'
  }
});


let showCityData = addDropdown('Show City Data', ['Yes', 'No'], 'No');
if (showCityData === 'Yes') {
  tableFromData({ data: cityDepressionArray});
}

addMdToPage(`
  **Summary**
  * A total of 30 cities had valid questionnaires, and the depression rates of students in these 30 cities all exceeded 50%
  * The data shows that students from cities like Ahmedabad	and Hyderabad have the highest depression rates,  around 67%,
   which means two of three students are depressed.
`);





// Degree vs Depression
addMdToPage(`
  ---
  ## DegreeLevel vs Depression
`);
const degreeLevelDepressionStat = {};
selectedAgeStudentData.forEach(student => {
  const degreeLevel = student.degreeLevel; // Ensure degree is valid
  const depression = student.depression; // 0 or 1

  // Only process if degree is valid and depression is valid
  if (degreeLevel && (depression === 0 || depression === 1)) {
    if (!degreeLevelDepressionStat[degreeLevel]) {
      degreeLevelDepressionStat[degreeLevel] = { depressed: 0, notDepressed: 0 };
    }
    if (depression === 1) {
      degreeLevelDepressionStat[degreeLevel].depressed += 1;
    } else {
      degreeLevelDepressionStat[degreeLevel].notDepressed += 1;
    }
  }
});
//console.log('degreeLevelDepressionStat', degreeLevelDepressionStat);
 
// Convert to array format for chart  
const degreeLevelDepressionArray = Object.entries(degreeLevelDepressionStat)
  .map(([degreeLevel, counts]) => ({
    degreelevel: degreeLevel,
    depressed: counts.depressed,
    notDepressed: counts.notDepressed,
    total: counts.depressed + counts.notDepressed,
    depressedRate: (counts.depressed / (counts.depressed + counts.notDepressed)) * 100
  }))
  .sort((a, b) => b.total - a.total);
//console.log('degreeLevelDepressionArray', degreeLevelDepressionArray);
//tableFromData({ data: degreeLevelDepressionArray });

const degreeLevelOrder = ['HighSchool', 'Undergraduate', 'Postgraduate', 'Doctoral', 'Others'];
const degreeLevelDepressionRateDataForChart = [
  ['DegreeLevel', 'Depression Rate', { role: 'annotation' }],
  ...degreeLevelDepressionArray
    .filter(item => item.total > 100)
    .map(item => {
      const rate = (item.depressed / item.total) * 100;
      return [item.degreelevel, rate, rate.toFixed(1) + '%'];
    })
    .sort((a, b) => degreeLevelOrder.indexOf(a[0]) - degreeLevelOrder.indexOf(b[0]))
];

//ColumnChart 
drawGoogleChart({
  type: 'ColumnChart',
  data: degreeLevelDepressionRateDataForChart,
  options: {
    height: 500,
    annotations: {
      alwaysOutside: true,
      textStyle: {
        fontSize: 12,
        color: '#000000', // Draw text color
      }
    },
    vAxis: {
      title: 'Depression Rate (%)',
      format: '#\'%\'',
      minValue: 0,
      maxValue: 80
    },
    hAxis: {
      slantedText: true,
      slantedTextAngle: 45,
    },
    legend: "none",
    chartArea: { left: 100,right:50},
    colors: ['#e2431e'],
    title: 'students depression rate by degreeLevel'
  }
});

addMdToPage(` 
  **Summary**
  * High School students show the highest depression rate, 70.8%, which is significantly higher than all other degree levels.
  * The depression rate among undergraduates, postgraduates, and doctoral students is relatively similar, ranging from 53.7% to 56.1%.
  * The depression data by degree level aligns with the age-based analysis — high school students, typically aged 20 or younger, are among the groups with the highest rates of depression.
`);



// AcademicPressure vs Depression
addMdToPage(`
  ---
  ## AcademicPressure & FinancialStress vs Depression
`);


// Step 1: build a heatmap matrix
const heatmapMatrix = {}; // pressure -> age -> count

selectedAgeStudentData.forEach(entry => {
  if (entry.depression !== 1) return;
  const age = entry.age;
  const pressure = entry.academicPressure;

  if (!heatmapMatrix[pressure]) heatmapMatrix[pressure] = {};
  if (!heatmapMatrix[pressure][age]) heatmapMatrix[pressure][age] = 0;
  heatmapMatrix[pressure][age]++;
});

// Step 2: change to TableChart 
const ages = Array.from({ length: 34 - 18 + 1 }, (_, i) => 18 + i);
const header = ['Academic Pressure', ...ages.map(String)];
const heatmapData = [header];

function getColorStyle(value, max) {
  const ratio = value / max;
  const red = 255;
  const greenBlue = Math.round(229 - ratio * 229); // 从 229 到 0
  return `background-color: rgb(${red}, ${greenBlue}, ${greenBlue});`;
}



const maxCount = Math.max(...Object.values(heatmapMatrix).flatMap(row => Object.values(row)));

for (let pressure = 0; pressure <= 5; pressure++) {
  const row = [`<strong>${pressure}</strong>`]; 
  for (const age of ages) {
    const count = heatmapMatrix[pressure]?.[age] || 0;
    const color = getColorStyle(count, maxCount);
    row.push(`<div style="${color}; text-align:center;">${count}</div>`);
  }
  heatmapData.push(row);
}

//console.log('heatmapMatrix', heatmapMatrix);
google.charts.load('current', { packages: ['table'] });
google.charts.setOnLoadCallback(() => {
  drawGoogleChart({
    containerId: 'academicHeatmapChart', 
    type: 'Table',
    data: heatmapData,
    options: {
      showRowNumber: false,
      width: '100%',
      height: '100%',
      allowHtml: true 
    }
  });
});



// FinancialStress vs Depression

// Step 1: build a heatmap matrix
const financialStressMatrix = {}; // stress -> age -> count

selectedAgeStudentData.forEach(entry => {
  if (entry.depression !== 1) return;
  const age = entry.age;
  const stress = entry.financialStress;

  if (!financialStressMatrix[stress]) financialStressMatrix[stress] = {};
  if (!financialStressMatrix[stress][age]) financialStressMatrix[stress][age] = 0;
  financialStressMatrix[stress][age]++;
});

// Step 2: change to TableChart 
const agesForFinancial = Array.from({ length: 34 - 18 + 1 }, (_, i) => 18 + i);
const headerForFinancial = ['Financial Stress', ...agesForFinancial.map(String)];
const financialHeatmapData = [headerForFinancial];

function getColorStyle(value, max) {
  const ratio = value / max;
  const red = 255;
  const greenBlue = Math.round(229 - ratio * 229); // 从浅红到深红
  return `background-color: rgb(${red}, ${greenBlue}, ${greenBlue});`;
}

const maxCountForFinancial = Math.max(...Object.values(financialStressMatrix).flatMap(row => Object.values(row)));

for (let stress = 0; stress <= 5; stress++) {
  const row = [`<strong>${stress}</strong>`]; 
  for (const age of agesForFinancial) {
    const count = financialStressMatrix[stress]?.[age] || 0;
    const color = getColorStyle(count, maxCountForFinancial);
    row.push(`<div style="${color}; text-align:center;">${count}</div>`);
  }
  financialHeatmapData.push(row);
}

google.charts.load('current', { packages: ['table'] });
google.charts.setOnLoadCallback(() => {
  drawGoogleChart({
    containerId: 'financialHeatmapChart', 
    type: 'Table',
    data: financialHeatmapData,
    options: {
      showRowNumber: false,
      width: '100%',
      height: '100%',
      allowHtml: true 
    }
  });
});
