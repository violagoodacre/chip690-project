var client = FHIR.client("https://r3.smarthealthit.org");
// console.log(client);



/*
* Parameters:
*   containerId: type: string - prepended id of container where the control is to be rendered.
*   label: type: string - label for the control
*   optionsList: type: list of objects - each object should have the keys display (string),
*                                        and data (anything needed to handle the selection
*   handleSelection: type: function - callback
*/
function createComboBox(containerId, label, optionsList, handleSelection) {
    const inputId = `${containerId}_input`;
    // console.log(optionsList);

    // create combo box using jquery autocomplete input widget
    const html = `
      <label for="${inputId}" style="display: block; margin-bottom: 4px;">${label}</label>
      <div style="display: inline-flex; align-items: center;">
        <input id="${inputId}" />
      </div>`;
    $(`#${containerId}`).html(html);

    // NOTE: CoPilot helped me with knowing how to map the fields
    $(`#${inputId}`).autocomplete({
        source: function(request, response) {
            const formattedOptions = optionsList.map(item => ({
                label: item.display,
                value: item.display,
                data: item.data
            }));
            response(formattedOptions);
        },

        minLength: 0,
        select: function(event, ui) {  // handle when an item is selected
            const selectedItem = {display: ui.item.value, data: ui.item.data};
            handleSelection(selectedItem); // callback

        }
    }).css("width", "200px");

    $(`#${inputId}`).on('click', function () {
        $(`#${inputId}`).focus().autocomplete('search', '');
    });
}



function displayPatientTestResults(patient_test_results){
    document.getElementById('vis_container').innerHTML = ''; // clear existing chart

    console.log(patient_test_results);

    const series_data = patient_test_results.map(item => [item.datetime, item.value]);

    console.log(series_data);

    // const y_values = patient_test_results.map(item => item.value);
    // let x_values = [];
    //
    // console.log(y_values);
    // console.log(x_values);
    //
    // const datetime_strings = patient_test_results.map(item => item.datetime);
    // datetime_strings.forEach(datetime_string => {
    //     let date = new Date(datetime_string);
    //     x_values.push(date.getFullYear());
    // });

    const options = {
        // chart: {
        //     type: 'bar'
        // },
        title: {text: `${patient_test_results[0].patient.display}: Test Results`},
        subtitle: {text: patient_test_results[0].display},
        yAxis: {
            title: {text: `Values (${patient_test_results[0].unit})`}
        },
        // xAxis: {
        //     accessibility: {rangeDescription: `Range: ${Math.min(x_values)} to ${Math.max(x_values)}`}
        // },
        series: { data: series_data }
    }

    console.log(options);

    Highcharts.chart('vis_container', options);





        // legend: {
        //     layout: 'vertical',
        //     align: 'right',
        //     verticalAlign: 'middle'
        // },

        // plotOptions: {
        //     series: {
        //         label: {
        //             connectorAllowed: false
        //         },
        //         pointStart: 2010
        //     }
        // },

    //     series: [{
    //         name: 'Installation & Developers',
    //         data: [
    //             43934, 48656, 65165, 81827, 112143, 142383,
    //             171533, 165174, 155157, 161454, 154610, 168960, 171558
    //         ]
    //     }, {
    //         name: 'Manufacturing',
    //         data: [
    //             24916, 37941, 29742, 29851, 32490, 30282,
    //             38121, 36885, 33726, 34243, 31050, 33099, 33473
    //         ]
    //     }, {
    //         name: 'Sales & Distribution',
    //         data: [
    //             11744, 30000, 16005, 19771, 20185, 24377,
    //             32147, 30912, 29243, 29213, 25663, 28978, 30618
    //         ]
    //     }, {
    //         name: 'Operations & Maintenance',
    //         data: [
    //             null, null, null, null, null, null, null,
    //             null, 11164, 11218, 10077, 12530, 16585
    //         ]
    //     }, {
    //         name: 'Other',
    //         data: [
    //             21908, 5548, 8105, 11248, 8989, 11816, 18274,
    //             17300, 13053, 11906, 10073, 11471, 11648
    //         ]
    //     }],
    //
    //     responsive: {
    //         rules: [{
    //             condition: {
    //                 maxWidth: 500
    //             },
    //             chartOptions: {
    //                 legend: {
    //                     layout: 'horizontal',
    //                     align: 'center',
    //                     verticalAlign: 'bottom'
    //                 }
    //             }
    //         }]
    //     }
    //


}



/*
* Parameters:
*   observation: type object - a FHIR observation object
* Returns:
*   object: display: string - display name
*           data: object - observation data needed for handling selection
*   if no patient name, returns null
*/
function getPatientTestItem(observation) {
    // console.log(observation);
    return {
        patient: getPatientSelectItem(observation.subject),
        display: getResourceItemDisplayName(observation),
        code: observation?.code?.coding[0]?.code ?? "",
        value: observation?.valueQuantity?.value ?? null,
        unit: observation?.valueQuantity?.unit ?? "unknown",
        high: observation?.referenceRange?.[0]?.high?.value ?? null,
        low: observation?.referenceRange?.[0]?.low?.value ?? null,
        datetime: observation?.effectiveDateTime ?? "unknown",
        context: observation?.context ?? "unknown"
    };
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
    console.log(patient);
    let name = '';
    for(let i=0; i<patient.name.length; i++){
        name = patient.name[i];
        if(name.use === 'official')
            break;
    }
    // console.log(name);
    if(name) {
        return { display: `${name.family}, ${name.given[0]}`,
            data: {family: name.family, given: name.given, id: patient.id }};
    }
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
* Parameters: none
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
    const codes=`${url}4548-4,${url}1558-6,${url}2345-7,${url}10451-2,${url}2075-0,${url}26539-5,${url}24323-8`;
    // console.log(`loinc diabetes diagnostic codes = ${codes}`);
    return codes;
}



/*
* Parameters: none
* Returns:
*   string: list of snomed diabetes code urls
*/
function getSnomedDiabetesCodes(){
    const url = 'http://snomed.info/sct|';
    const codes = `${url}73211009,${url}46635009,${url}44054006,${url}11687002,${url}190388001,`+
        `${url}199225006,${url}8718002,${url}237605008,${url}421752006`;
    // console.log(`snomed diabetes codes = ${codes}`);
    return codes;
}



/*
* Parameters: none
* Returns:
*   string: list of snomed pre-diabetes code urls
*/
function getSnomedPreDiabetesCodes(){
    const url = 'http://snomed.info/sct|';
    const codes = `${url}15777000,${url}11687002,${url}15784000,${url}111552007,${url}190321009,${url}127013003`;
    // console.log(`snomed pre-diabetes codes = ${codes}`);
    return codes;
}



/*
* Parameters:
*   patient: type object: a patient object which is the item selected from the patients select box
* Returns: none
 */
function handlePatientSelected(patient) {
    // reinitialize downstream global variables
    test_select_items = [];
    patient_observations = [];

    // console.log(patient);
    const url = `Observation?patient=${patient.data.id}&code=${getLoinCDiagnosticCodes()}`;
    // console.log(url);
    requestPatientObservations(url)
}



/*
* Parameters:
*   patient: type object: a patient object which is the item selected from the patients select box
* Returns: none
 */
function handleTestSelected(test) {
    // console.log(test);
    // console.log(patient_observations);

    const test_results = [];

    for (let item of patient_observations) {
        if (item.code === test.data)
            test_results.push(item);
    }
    displayPatientTestResults(test_results);
}



/*
* Parameters:
*   url: type string: request url to send to FHIR client
* Returns: none
*/
let test_select_items = [];
let patient_observations = [];
// let requestPatientObservations_recursion_depth = 0;  // for debugging recursion
async function requestPatientObservations(url) {

    /*
    * Parameters:
    *   list: type list of objects - the set of objects to add to
    *   obj: type object - the object to be added
    * Returns:
    *   true if the object is in the set
    *   false if the object is not in the set
    */
    function isDuplicateTestType(list, obj) {
        for (let item of list) {
            if (item.code === obj.code)
                return true;
        }
        return false;
    }


    // requestPatientObservations_recursion_depth++;  // for debugging recursion
    // console.log('Recursion Depth:', requestPatientObservations_recursion_depth); // for debugging recursion
    let request_url = url;
    // console.log(request_url);

    try {
        const response = await client.request(url, {
            resolveReferences: ["subject"]
        });
        // console.log(response); // log the entire response to understand its structure

        // iterate through response entries
        response.entry.forEach(entry => {
            // we are only interested in laboratory test results
            if ((entry.resource?.resourceType ?? "") === "Observation" &&
                (entry.resource?.category[0]?.coding[0]?.code ?? "") === 'laboratory') {

                let display = getResourceItemDisplayName(entry.resource);

                let new_item = {display: display, data: entry.resource?.code?.coding[0]?.code ?? ""};
                if (display && !isDuplicateTestType(test_select_items, new_item))
                    test_select_items.push(new_item);

                // get what's needed to handle a test selection
                patient_observations.push(getPatientTestItem(entry.resource));
            }
        });

        // get the link to get the next page of patient data
        const nextLink = (response.link || []).find(l => l.relation === "next");
        request_url = nextLink ? nextLink.url : '';
        // console.log(request_url);

        if (request_url) {
            await requestPatientObservations(request_url); // recursion to get next page
        } else {
            // console.log('Recursion Terminated'); // for debugging recursion
            // requestPatientObservations_recursion_depth = 0; // reset recursion depth
            // console.log(test_select_items);
            // console.log(patient_observations);
            // create the patients select box
            createComboBox('obs_container', 'Select a diagnostic test:', test_select_items,
                handleTestSelected);
        }
    } catch (error) {
        console.error('Error getting observations:', error);
    }
}



/*
* NOTE: I used CoPilot to help me to debug this function
* Parameters:
*   url: type string: request url to send to FHIR client
* Returns: none
*/
let patients_select_items = [];
// let requestPatients_recursion_depth = 0; // for debugging recursion
async function requestPatients(url) {
    // requestPatients_recursion_depth++; // for debugging recursion
    // console.log('Recursion Depth:', requestPatients_recursion_depth); // for debugging recursion
    let request_url = url;

    try {
        const response = await client.request(url, {});
        // console.log(response); // log the entire response to understand its structure

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
                    // console.log(selectItem);
                    if (selectItem) // if not null
                        patients_select_items.push(selectItem);
                }
            }
        });

        // console.log(patients);

        // get the link to get the next page of patient data
        const nextLink = (response.link || []).find(l => l.relation === "next");
        request_url = nextLink ? nextLink.url : '';
        // console.log(request_url);

        if (request_url) {
            await requestPatients(request_url); // recursion to get next page
        } else {
            // console.log('Recursion Terminated'); // for debugging recursion
            // requestPatients_recursion_depth = 0; // reset recursion depth

            // create the patients select box
            createComboBox('pats_container', 'Select a patient:', patients_select_items,
                handlePatientSelected);
        }
    } catch (error) {
        console.error('Error getting patients:', error);
    }
}

/* NOTE: requesting each condition separately because there is a bug wherein calling both sets of codes
         together causes the recursion to not return before the request times out. */
requestPatients(`Patient?_has:Condition:patient:code=${getSnomedDiabetesCodes()}&_count=100`);
requestPatients(`Patient?_has:Condition:patient:code=${getSnomedPreDiabetesCodes()}&_count=100`);
