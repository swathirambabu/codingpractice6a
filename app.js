const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    stateId: dbObject.state_id,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    deaths: dbObject.deaths,
    active: dbObject.active,
    cured: dbObject.cured,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  const statesNames = `select * from state;`;
  const allStatesArray = await db.all(statesNames);
  response.send(
    allStatesArray.map((eachStates) =>
      convertDbObjectToResponseObject(eachStates)
    )
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `select * from state where state_id=${stateId};`;
  const stateDetails = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(stateDetails));
});
//API3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cured, cases, deaths, active } = request.body;
  const addNewDistrict = `insert into district (district_name,state_id,cured,cases,deaths,active)
    values( '${districtName}',
            '${stateId}',
            '${cured}',
            '${cases}',
            '${deaths},
            '${active}')`;
  const dbResponse = await db.run(addNewDistrict);
  const newDistrictDetails = dbResponse.lastID;
  response.send("District Successfully Added");
});

//api4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtArray = `select * from district where district_id=${districtId};`;
  districtDetails = await db.get(districtArray);
  response.send(convertDbObjectToResponseObject(districtDetails));
});

//api5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const removeDetails = `delete from district where district_id=${districtId};`;
  await db.run(removeDetails);
  response.send("District Removed");
});

//api6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cured, cases, deaths, active } = request.body;
  const updateDistrict = `update  district
    set district_name='${districtName}',
            state_id='${stateId}',
            cured='${cured}',
            cases='${cases}',
            deaths='${deaths},
            active='${active}'
            where district_id=${districtId}`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//api7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `select  SUM(cases),SUM(cured),SUM(deaths),SUM(active) from district where state_id=${stateId};`;
  const stateDetails = await db.get(stateQuery);
  response.send({
    totalCases: stateDetails["SUM(cases)"],
    totalActive: stateDetails["SUM(active)"],
    totalCured: stateDetails["SUM(cured)"],
    totalDeaths: stateDetails["SUM(deaths)"],
  });
});
//api 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuey = `select state_name from state NATURAL JOIN district where district_id=${districtId};`;
  const stateName = await db.get(stateQuey);
  response.send(convertDbObjectToResponseObject(stateName));
});
module.exports = app;
