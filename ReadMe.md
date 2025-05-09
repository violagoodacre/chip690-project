# CHIP690-297-Spring 2025 Project

This is my CHIP-690-297-Spring2025 project. It dispalys diabetes diagnostic test results for a specific patient. Patients with diabetes or prediabetes were selected using a sample (non-exhaustive) list of SNOMED CT codes. Test results were obtained using LOINC codes. The display uses HighCharts. You can view the demo video here: [https://www.youtube.com/watch?v=EtyQ90d409o](https://www.youtube.com/watch?v=EtyQ90d409o).

## How to use:
1. Open in a web browser ([https://violagoodacre.github.io/chip690-project/](https://violagoodacre.github.io/chip690-project/)).
2. Select a patient. Most patients only have one test type, and some have few test results. If you want to see more than one test type, try selecting one of these patients: **Carol Allen, Ruth Black, Anthony Coleman, Anthony Shaw, Frank Taylor**. I recommend selecting to view **Frank Taylor or Anthony Shaw's Glucose test results**. There are likely to be more, but these are the names I have found so far with more than one type of SNOMED CT diabetes diagnostic test.
3. Select a test type. A timeseries chart of the patient's test results will show.
4. Hover over datapoints to see the data for that datapoint.

I have also included a launch.html for launching in SmartHealthIT, but there is no need to do this because the webpage is stand-alone. It uses Jon Tweedy's Smart on FHIR demo repo [https://github.com/jetweedy/smart_on_fhir](https://github.com/jetweedy/smart_on_fhir) for code to launch.

If you want to view it in SmartHealthIT, here are the steps:
1. Go to the smarthealthit launch form ([https://launch.smarthealthit.org/](https://launch.smarthealthit.org/)),
2. Enter the path to the launch.html file ([https://violagoodacre.github.io/chip690-project/launch.html](https://violagoodacre.github.io/chip690-project/launch.html)),
3. Click "Launch".

## Improvement ideas:
1. Move the infomation area above the chart to be to the side of the chart (left or right).
2. Get and display the Condition information when the patient is selected, not when the test type is selected.
3. Add to the information area Patient information.
4. Improve aesthetics.
5. Improve user feedback.
6. Use valuesets that automatically fetch child codes rather than hard-coding the code values.
7. Use the SmartHealthIT selected patient when using the SmartHealthIT launch, and use the patients combo box when viewing as a stand-alone website.
