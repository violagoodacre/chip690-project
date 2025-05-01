let client = FHIR.client("https://r3.smarthealthit.org");
// console.log(client);


//////////////////////////// UTILITY FUNCTIONS ////////////////////////////


/*
* Pareameters:
*   obj: type any
* Returns:
*   true if obj is a non-empty object or  false if obj is not an object, is null, or is empty
*/
function isNonEmptyObject(obj) {
    return (typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0);
}


/*
* Returns:
*   string: list of LoinC diabetes diagnostic test code urls
*/
function getLoinCDiagnosticCodes(){
    const url = 'http://loinc.org|';
    /*
        Test	                        LOINC Code
        Hemoglobin A1c	                4548-4
        Glucose [Fast] in Serum/Plasma  1558-6
        Glucose [Mass/volume]	        2345-7
        Glucose tolerance test (2 hr)   10451-2
        Insulin	                        2075-0
        C-peptide	                    26539-5
        Diabetes panel	                24323-8
    */
    return `${url}4548-4,${url}1558-6,${url}2345-7,${url}10451-2,${url}2075-0,${url}26539-5`; //,${url}24323-8`;;
}


/*
* Returns:
*   string: list of snomed diabetes code urls
*/
function getSnomedDiabetesCodes(){
    /*
        Some common SNOMED codes for Diabetes from ChatGPT
        // type 2
        46635009	Type 2 diabetes mellitus uncontrolled
        8718002	    Secondary diabetes mellitus (diabetes due to another condition, e.g., pancreatitis)
        15784000	Diabetes mellitus, adult onset type (older terminology for T2DM)
        127013003	Type 2 diabetes mellitus with nephropathy
        111552007	Type 2 diabetes mellitus with retinopathy
        190388001	Type 2 diabetes mellitus with neuropathy
        421752006   Type 2 diabetes mellitus with polyneuropathy (nerve damage)
        111556003	Type 2 diabetes mellitus with gangrene
        111558002   Type 2 diabetes mellitus with ulcer
        440540002 	Type 2 diabetes mellitus with peripheral angiopathy
        111552007	Non-insulin dependent diabetes mellitus, uncontrolled (basically poorly controlled T2DM)
        190321009	Maturity onset diabetes of the young (MODY, a genetic type of diabetes)
        127013003	Gestational diabetes mellitus (diabetes during pregnancy)
        // type 1
        44054006	Diabetes mellitus type 1
        237605008	Type 1 diabetes mellitus with nephropathy (kidney damage from T1DM)
        15777000	Diabetes mellitus, juvenile type (older terminology for T1DM)
        // broad
        73211009	Diabetes mellitus
        11687002	Disorder of glucose metabolism (broad category, includes diabetes and prediabetes)
        pre-diabetes
        190388001	Impaired glucose tolerance (prediabetes condition)
        199225006	Impaired fasting glucose (another prediabetes condition)
     */

    const url = 'http://snomed.info/sct|';
    // type 2
    let codes = `${url}46635009,${url}8718002,${url}15784000` +
    `,${url}127013003,${url}111552007,${url}190388001,${url}421752006,${url}111558002` +
    `,${url}111556003,${url}440540002,${url}111552007,${url}190321009,${url}127013003`;
    // type 1
    codes += `,${url}44054006,${url}237605008,${url}15777000`;
    // prediabetes
    codes += `,${url}190388001,${url}199225006`;
    // broad
    codes += `,${url}73211009,${url}11687002`;
    // console.log(`snomed diabetes codes = ${codes}`);
    return codes;
}


////////////////// DISPLAY AND DISPLAY HANDLING FUNCTIONS ///////////////////


/*
* Parameters:
*   containerId: type: string - prepended id of container where the control is to be rendered.
*   label: type: string - label for the control
*   wodth: type: string - the width of the input box in pixels
*   optionsList: type: list of objects - each object should have the keys display (string),
*                                        and data (anything needed to handle the selection
*   handleSelection: type: function - callback
*/
function createComboBox(containerId, label, width, optionsList, handleSelection) {
    const inputId = `${containerId}_input`;
    // console.log('optionsList', optionsList);

    // create combo box using jquery autocomplete input widget
    const html = `
      <label for="${inputId}" style="display: block; margin-bottom: 4px;">${label}</label>
      <div style="display: inline-flex; align-items: center;">
        <input id="${inputId}" />
      </div>`;
    $(`#${containerId}`).html(html);

    // NOTE: CoPilot helped me debug the autocomplete to make it more efficient

    const formattedOptions = optionsList.map(item => ({
        label: item.display,
        value: item.display,
        data: item.data
    }));

    $(`#${inputId}`).autocomplete({
        source: function(request, response) {
            const results = $.ui.autocomplete.filter(formattedOptions, request.term);
            response(results);
        },
        minLength: 0,
        delay: 300,
        select: function(event, ui) {  // handle when an item is selected
            const selectedItem = {display: ui.item.value, data: ui.item.data};
            handleSelection(selectedItem); // callback

        }
    }).css("width", width);

    $(`#${inputId}`).on('click', function () {
        $(`#${inputId}`).focus().autocomplete('search', '');
    });
}


/*
* Parameters:
*   patient_test_results: type: object - patient test results as defined by the handleTestSelected function
*/
function displayPatientTestResults(patient_test_results){
    console.log('patient_test_results', patient_test_results);
    const condition = patient_test_results[0].test.condition;

    document.getElementById('vis_container').innerHTML = ''; // clear existing chart

    // show the patient's diagnosed condition
    document.getElementById('info_container').innerHTML =
        `<div>Diagnosis: ${condition?.display ?? 'unknown'}<br>` +
        `Code: ${condition?.data?.code?.coding[0]?.code ?? 'unknown'}<br>` +
        `System: ${condition.data?.code?.coding[0]?.system ?? 'unknown'}</div>` +
        `<div>Asserted: ${condition?.data?.assertedDate ?? 'unknown'}<br>` +
        `Onset: ${(condition?.data?.onsetDateTime ?? 'unknown').split('T')[0]}<br>` +
        `Status: ${condition?.data?.clinicalStatus ?? 'unknown'}</div>`;

    // convert patient test result date strings to dates
    let dates = []
    const datetime_strings = patient_test_results.map(item => item.test.datetime);
    datetime_strings.forEach(datetime_string => {
        let date = new Date(datetime_string).getTime();
        dates.push(date);
    });
    // console.log('dates', dates);

    const values = patient_test_results.map(item => item.test.value);
    // console.log('values', values);
    const series_data = dates.map((item, i) => [item, values[i]]);
    series_data.sort((a, b) => a[0] - b[0]);
    // console.log('series_data', series_data);

    // check if high and low values exist
    const high = patient_test_results[0]?.test?.high ?? null;
    const low = patient_test_results[0]?.test?.low ?? null;


    // NOTE: CoPilot helped with conditional defining of plotlines
    const plotLines = [];

    // set the high line if it exists and is not zero
    if (high && high !== 0) {
        plotLines.push({
            value: high,
            color: 'red',
            width: 2,
            label: {
                text: 'High',
                align: 'left',
                style: {
                    color: 'red'
                }
            }
        });
    }

    // set the low line if it exists and is not zero
    if (low && low !== 0) {
        plotLines.push({
            value: low,
            color: 'blue',
            width: 2,
            label: {
                text: 'Low',
                align: 'left',
                style: {
                    color: 'blue'
                }
            }
        });
    }

    // Reference: https://jsfiddle.net/BlackLabel/y0dkzn1q/

    Highcharts.chart('vis_container', {
        chart: {
            padding: 20
        },
        title: {
            text: patient_test_results[0].display
        },
        subtitle: {
            text: patient_test_results[0].test.patient.display
        },
        yAxis: {
            title: {
                text: `Values (${patient_test_results[0].unit})`
            },
            plotLines: plotLines
        },
        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%Y-%m-%d}',
                rotation: -45 // rotate 45 degrees left
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            formatter: function () {
                return `<b>${patient_test_results[0].display}</b><br>` +
                    `Date: ${Highcharts.dateFormat('%Y-%m-%d', this.x)}<br> ` +
                    `Value: ${this.y} ${patient_test_results[0].unit}`;
            }
        },
        series: [{
            data: series_data,
            marker: {
                enabled: true,
                symbol: 'circle'
            }
        }]
    });
}


/*
* Parameters:
*   observation: type object - a FHIR observation object
*   patient: type object: patient info from the patient drop-down selection
* Returns:
*   object: display: string - display name
*           data: object - observation data needed for handling selection
*   if no patient name, returns null
*/
function getPatientTestItem(observation, patient) {
    // console.log('observation', observation);
    // console.log('getPatientTestItem patient', patient);

    let data =  {
        patient: patient,
        display: getResourceItemDisplayName(observation),
        code: observation?.code?.coding[0]?.code ?? "",
        value: observation?.valueQuantity?.value ?? null,
        unit: observation?.valueQuantity?.unit ?? "unknown",
        high: observation?.referenceRange?.[0]?.high?.value ?? null,
        low: observation?.referenceRange?.[0]?.low?.value ?? null,
        datetime: observation?.effectiveDateTime ?? "unknown",
        context: observation?.context ?? "unknown"
    };


    if(isNonEmptyObject(patient_condition) && (patient_condition.patient === data.patient.data.id)) {
        data['condition'] = patient_condition;
    }
    else
        console.log('patient condition is empty')
    return data;
}


/*
* Parameters:
*   patient: type: object - a FHIR patient object
* Returns:
*   object: display: string - display name
*           data: object - patient data needed for handling selection
*   if no patient name, returns null
*/
function getPatientSelectItem(patient) {
    let name = '';
    for(let i=0; i<patient.name.length; i++){
        name = patient.name[i];
        if(name.use === 'official')
            break;
    }
    if(name)
        return { display: `${name.family}, ${name.given[0]}`,
            data: {family: name.family, given: name.given, id: patient.id }};
    else
        return null;
}


/*
* Parameters:
*   resource: type: object - a FHIR resource object
* Returns:
*   string: the resource's display text
*/
function getResourceItemDisplayName(resource) {
    let display = resource?.code.text ?? "";
    if (display === "") {
        display = resource?.code?.coding[0]?.display ?? "";
    }
    return display;
}


/*
* Parameters:
*   patient: type object: a patient object which is the item selected from the patients select box
 */
let patient_condition = {};
function handlePatientSelected(patient) {
    // console.log('patient', patient);

    // reinitialize downstream global variables
    test_select_items = [];
    patient_observations = [];
    patient_condition = {};
    document.getElementById('obs_container').innerHTML = ''; // clear test type selection
    document.getElementById('vis_container').innerHTML = ''; // clear chart
     document.getElementById('info_container').innerHTML = ''; // clear info


    let url = `Condition?patient=${patient.data.id}&code=${encodeURIComponent(getSnomedDiabetesCodes())}&_count=100`;
    // console.log('url', url);
    requestPatientCondition(url, patient);

    url = `Observation?patient=${patient.data.id}&code=${encodeURIComponent(getLoinCDiagnosticCodes())}&_count=100`;
    // console.log('url', url);
    requestPatientObservations(url, patient)
}


/*
* Parameters:
*   patient: type object: a patient object which is the item selected from the patients select box
 */
function handleTestSelected(test) {
    // console.log('test.display', test.display);
    // console.log('patient_observations', patient_observations);
    document.getElementById('vis_container').innerHTML = ''; // clear existing chart

    const test_results = [];

    for (let item of patient_observations) {
        if (item.test.code === test.data)
            test_results.push(item);
    }
    // console.log('test_results', test_results);
    displayPatientTestResults(test_results);
}


//////////////////////////// ASYNC REQUEST FUNCTIONS ////////////////////////


/*
* Parameters:
*   request_url: type string: request url to send to FHIR client
*   patient: type object: patient info from the patient drop-down selection
*/
async function requestPatientCondition(request_url, patient) {
    // console.log('patient', patient);
    try {
        const response = await client.request(request_url, {});
        // console.log('requestPatientCondition response', response); // log the entire response to understand its structure

        // sort responses by assertedDate
        response.entry.sort((a, b) => a.response.assertedDate - b.response.assertedDate);

        // iterate through response entries
        response.entry.forEach(entry => {
            // we are only interested in the most recent active condition
            if (((entry.resource?.resourceType ?? "") === "Condition") &&
                ((entry.resource?.clinicalStatus ?? "") === "active")) {
                patient_condition = {display: getResourceItemDisplayName(entry.resource), patient: patient.data.id, data: entry.resource};
            }
        });
        // console.log('patient_condition', patient_condition);
    } catch (error) {
        console.error('Error getting patient condition:', error);
    }
}


/*
* Parameters:
*   url: type string: request url to send to FHIR client
*   patient: type object: patient info from the patient drop-down selection
*/
let test_select_items = [];
let patient_observations = [];
// let requestPatientObservations_recursion_depth = 0;  // for debugging recursion
async function requestPatientObservations(url, patient) {
    /*
    * Parameters:
    *   list: type list of objects - the set of objects to add to
    *   obj: type object - the object to be added
    * Returns:
    *   true if the object is in the set
    *   false if the object is not in the set
    */
    function isDuplicateTestType(list, obj) {
        // console.log(obj);
        for (let item of list) {
            if (item.data === obj.data)
                return true;
        }
        return false;
    }

    /*
    * Parameters:
    *   list: type list of objects - the set of objects to add to
    *   obj: type object - the object to be added
    * Returns:
    *   true if the object is in the set
    *   false if the object is not in the set
    */
    function isDuplicateTestResult(list, obj) {
        // console.log('isDuplicateTestResult list', list);
        for (let item of list) {
            if ((item.code === obj.code) && (item.datetime === obj.datetime) &&
                (item.test.data.family === obj.test.data.family) &&
                (item.test.data.given === obj.test.data.given[0]))
                return true;
        }
        return false;
    }


    // requestPatientObservations_recursion_depth++;  // for debugging recursion
    // console.log('Recursion Depth:', requestPatientObservations_recursion_depth); // for debugging recursion
    let request_url = url;
    // console.log('request_url', request_url);

    try {
        const response = await client.request(url, {});
        // console.log('requestPatientObservations response', response); // log the entire response to understand its structure

        // iterate through response entries
        response.entry.forEach(entry => {
            // we are only interested in laboratory test results
            if ((entry.resource?.resourceType ?? "") === "Observation" &&
                (entry.resource?.category[0]?.coding[0]?.code ?? "") === 'laboratory') {

                // get the options for the diagnostic tests select box
                let display = getResourceItemDisplayName(entry.resource);
                let new_item = {display: display, data: entry.resource?.code?.coding[0]?.code ?? ""};
                if (display && !isDuplicateTestType(test_select_items, new_item))
                    test_select_items.push(new_item);

                // get what's needed to handle a test selection
                if (!isDuplicateTestResult(patient_observations, entry.resource)) {
                    // if (display && !isDuplicateTestType(test_select_items, new_item)) {
                        new_item =
                            {display: display, test: getPatientTestItem(entry.resource, patient)};
                        patient_observations.push(new_item);
                    // }
                }
            }
        });

        // get the link to get the next page of patient data
        const nextLink = (response.link || []).find(l => l.relation === "next");
        request_url = nextLink ? nextLink.url : '';
        // console.log(request_url);

        if (request_url) {
            await requestPatientObservations(request_url, patient); // recursion to get next page
        } else {
            // console.log('Recursion Terminated'); // for debugging recursion
            // requestPatientObservations_recursion_depth = 0; // reset recursion depth

            // handle items for the select box
            test_select_items.sort((a, b) => a.display.localeCompare(b.display));
            // console.log('test_select_items = ', test_select_items);
            /*
                carol allen
                ruth black
                anthony coleman
                frank taylor
             */

            // create the patients select box
            createComboBox('obs_container', 'Select a diagnostic test:', '400px', test_select_items,
                handleTestSelected);
        }
    } catch (error) {
        console.error('Error getting patient observations:', error);
    }
}


// NOTE: I used CoPilot to help me to debug this function
/*
* Parameters:
*   url: type string: request url to send to FHIR client
*/
let patients_select_items = [];
// let requestPatients_recursion_depth = 0; // for debugging recursion
async function requestPatients(url) {
    // requestPatients_recursion_depth++; // for debugging recursion
    // console.log('Recursion Depth:', requestPatients_recursion_depth); // for debugging recursion
    let request_url = url;

    try {
        const response = await client.request(url, {});
        // console.log('requestPatients response (single iteration)', response); // log the entire response to understand its structure

        // iterate through response entries
        response.entry.forEach(entry => {
            // only look at patients (which should be all of them as the request was a Patients request
            if ((entry.resource?.resourceType ?? "") === "Patient") {
                // filter out dead people
                const deceased = (entry.resource?.deceasedBoolean ?? false) ||
                    (entry.resource?.deceasedDateTime ?? '').length > 0;
                if(!deceased) {
                    // get what's needed to populate the select box
                    let selectItem = getPatientSelectItem(entry.resource);
                    if (selectItem) // if not null
                        patients_select_items.push(selectItem);
                }
            }
        });

        // get the link to get the next page of patient data
        const nextLink = (response.link || []).find(l => l.relation === "next");
        request_url = nextLink ? nextLink.url : '';

        if (request_url) {
            await requestPatients(request_url); // recursion to get next page
        } else {
            // console.log('Recursion Terminated'); // for debugging recursion
            // requestPatients_recursion_depth = 0; // reset recursion depth

            // put in alphabetical order
            patients_select_items.sort((a, b) => a.display.localeCompare(b.display));
            // console.log('patients_select_items', patients_select_items);
            // create the patients select box
            createComboBox('pats_container', 'Select a patient:', '250px',  patients_select_items,
                handlePatientSelected);
        }
    } catch (error) {
        console.error('Error getting patients:', error);
    }
}

// requestPatients(`Patient?_has:Condition:patient:code=${encodeURIComponent(getSnomedDiabetesCodes())}&_count=100`);



// try to get the patient (assumption is that if were are using smarthealthit launch, we have selected a patient there
FHIR.oauth2.ready().then(function(client) {
    client.patient.read().then(
        function(patient) {
                handlePatientSelected(patient);
        },
        function(error) {
            // log the error
            console.log(`Patient does not exist. We are probably not using the SmartHealthIT launcher. ` +
                `Attempt to get patient failed with error: ${error.stack}`);
            // use the stand-alone webpage patients drop-down
            requestPatients(`Patient?_has:Condition:patient:code=${encodeURIComponent(getSnomedDiabetesCodes())}&_count=100`);
        }
    );
}).catch(console.error);