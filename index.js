var client = FHIR.client("https://r3.smarthealthit.org");
// console.log(client);

function createComboBox(containerId, label, optionsList, requestPatientObservations) {
    const inputId = `${containerId}_input`;
    // console.log(optionsList);

    // Create combo box HTML
    const html = `
      <label for="${inputId}" style="display: block; margin-bottom: 4px;">${label}</label>
      <div style="display: inline-flex; align-items: center;">
        <input id="${inputId}" />
      </div>`;

    $(`#${containerId}`).html(html);
    $(`#${inputId}`).autocomplete({
        source: optionsList,
        minLength: 0,
        select: function(event, ui) {
            // Display data when an item is selected
            const selectedItem = {name: ui.item.value, id: ui.item.id};
            requestPatientObservations(selectedItem);
        }
    }).css("width", "200px");

    $(`#${inputId}`).on('click', function () {
        $(`#${inputId}`).focus().autocomplete('search', '')
    });
}

function displayPatientTestResults(patient_test_results){
    console.log(patient_test_results);
}

function getPatientFullName(patient) {
    let name = '';
    for(let i=0; i<patient.name.length; i++){
        name = patient.name[i];
        if(name.use === 'official')
            break;
    }
    // console.log(name);
    if(name) {
        let fullname = `${name.family}, ${name.given}`
        return { name: `${fullname}`, value: `${fullname}`, id: `${patient.id}`};
    }
    else
        return '';
}

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

function getSnomedDiabetesCodes(){
    const url = 'http://snomed.info/sct|';
    const codes = `${url}73211009,${url}46635009,${url}44054006,${url}11687002,${url}190388001,`+
        `${url}199225006,${url}8718002,${url}237605008,${url}421752006`;
    // console.log(`snomed diabetes codes = ${codes}`);
    return codes;
}

function getSnomedPreDiabetesCodes(){
    const url = 'http://snomed.info/sct|';
    const codes = `${url}15777000,${url}11687002,${url}15784000,${url}111552007,${url}190321009,${url}127013003`;
    // console.log(`snomed pre-diabetes codes = ${codes}`);
    return codes;
}

function handlePatientSelected(selectedItem) {
    // Example: Display the selected item in an alert
    // alert(`You selected: ${selectedItem.name}`);

    let patient_info = {'patient': selectedItem, 'observations': []};

    client.request(`Observation?patient=${selectedItem.id}&code=${getLoinCDiagnosticCodes()}`, {}).then(response => {
        // console.log(response); // Log the entire response to understand its structure

        if (response.total > 0) {
            response.entry.forEach(entry => {
                if (entry.resource.resourceType === "Observation" &&
                    entry.resource.category[0].coding[0].code === 'laboratory') {

                    // NOTE: I used ChatGPT to help me to debug the safe assignment
                    //       of values to the new_item object
                    let new_item = {
                        observation: entry.resource.code?.text ?? "N/A",
                        value: entry.resource.valueQuantity?.value ?? null,
                        unit: entry.resource.valueQuantity?.unit ?? "unknown",
                        high: entry.resource.referenceRange?.[0]?.high?.value ?? null,
                        low: entry.resource.referenceRange?.[0]?.low?.value ?? null,
                        datetime: entry.resource.effectiveDateTime ?? "unknown date",
                        text: entry.resource.text?.div ?? ""
                    };

                    patient_info['observations'].push(new_item);
                }
            });

            console.log(patient_info);
            // requestPatientConditions(patient_info);
            displayPatientTestResults(patient_info);
            // TODO: draw a graph of test results
            //       1) create a drop-down list of test names
            //       2) on select an item:
            //          a) isolate the selected observations
            //          b) check that the units of measurement are the same for all values
            //          c) show graph of results for that test over time
        }
    });
}

function requestPatientConditions(patient){
    // TODO: Wait for this to complete, then request pre-diabetes conditions
    // client.request(`Condition?patient=Patient/${patient.id}&code=${getSnomedDiabetesCodes()}`, {}).then(
    //     response => {
    //         console.log(response); // Log the entire response to understand its structure
    //         // TODO: match-up patients with conditions
    //         //       display patient conditions
    //     });
}

let patients = [];
let recursionDepth = 0; // Initialize recursion depth counter


// NOTE: I used CoPilot to help me to debug this function
async function requestPatients(url) {
    // recursionDepth++; // Increment recursion depth
    // console.log('Recursion Depth:', recursionDepth); // Log recursion depth
    let request_url = url;

    try {
        const response = await client.request(url, {});
        // console.log(response); // log the entire response to understand its structure

        response.entry.forEach(entry => {

            if (entry.resource.resourceType === "Patient") { // check the resource type

                const deceased = (entry.resource?.deceasedBoolean ?? false) ||
                    (entry.resource?.deceasedDateTime ?? '').length > 0;

                if(!deceased) {// skip if the person is dead
                    let patient_name = getPatientFullName(entry.resource);
                    // console.log(patient_name);
                    if (patient_name !== '')
                        patients.push(patient_name);
                }
            }
        });

        // console.log(patients);

        const nextLink = (response.link || []).find(l => l.relation === "next");
        request_url = nextLink ? nextLink.url : '';
        // console.log(request_url);

        if (request_url) {
            await requestPatients(request_url); // recursion
        } else {
            console.log('Recursion Terminated');
            console.log(patients);
            createComboBox('ctrl_container', 'Select a patient:', patients, handlePatientSelected);
        }
    } catch (error) {
        console.error('Error getting patients:', error);
    }
}

requestPatients(`Patient?_has:Condition:patient:code=${getSnomedDiabetesCodes()}&_count=100`);
requestPatients(`Patient?_has:Condition:patient:code=${getSnomedPreDiabetesCodes()}&_count=100`);
