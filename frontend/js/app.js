const API_URL = "http://127.0.0.1:8000";


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const audioFile = document.getElementById("audioFile");
const browseBtn = document.getElementById("browseBtn");
const fileInfo = document.getElementById("fileInfo");
const analyzeBtn = document.getElementById("analyzeBtn");

const resultCard = document.getElementById("resultCard");

const predictionText =
    document.getElementById("predictionText");

const confidenceText =
    document.getElementById("confidenceText");
const predictionIcon =
    document.getElementById("predictionIcon");
const resultOverview =
    document.querySelector(".result-overview");
const riskBadge =
    document.getElementById("riskBadge");
// ============================================================
// SAFE ELEMENT UPDATE
// ============================================================

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// ============================================================
// TEST BACKEND CONNECTION
// ============================================================

async function checkBackend() {

    try {

        const response = await fetch(
            `${API_URL}/`
        );

        const data =
            await response.json();

        console.log(
            "Backend connected:",
            data
        );

    } catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

    }

}

checkBackend();


// ============================================================
// BROWSE BUTTON
// ============================================================

browseBtn.addEventListener(
    "click",
    function () {

        console.log(
            "Browse button clicked"
        );

        audioFile.click();

    }
);


// ============================================================
// FILE SELECTION
// ============================================================

audioFile.addEventListener(
    "change",
    function () {

        console.log(
            "File selection changed"
        );

        if (
            audioFile.files.length > 0
        ) {

            const selectedFile =
                audioFile.files[0];

            console.log(
                "Selected file:",
                selectedFile.name
            );

            fileInfo.textContent =
                `Selected: ${selectedFile.name}`;

            // Hide previous result
            if (resultCard) {

                resultCard.style.display =
                    "none";

            }

        }

    }
);


// ============================================================
// SCORE-CAM DISPLAY
// ============================================================

function displayScoreCAM(scoreCam) {

    console.log(
        "Displaying Score-CAM:",
        scoreCam
    );


    // --------------------------------------------------------
    // If Score-CAM failed
    // --------------------------------------------------------

    if (
        !scoreCam ||
        scoreCam.error
    ) {

        console.error(
            "Score-CAM error:",
            scoreCam
                ? scoreCam.error
                : "No Score-CAM data"
        );

        return;

    }


    // --------------------------------------------------------
    // HEATMAP IMAGE
    // --------------------------------------------------------

    const heatmapImage =
        document.getElementById(
            "scoreCamImage"
        );

    if (heatmapImage) {

        heatmapImage.src =
            scoreCam.heatmap_image;

        heatmapImage.style.display =
            "block";

    }


    // --------------------------------------------------------
    // HEATMAP STATISTICS
    // --------------------------------------------------------

    setText(
        "peakImportance",
        Number(
            scoreCam.peak_attention
        ).toFixed(6)
    );

    setText(
        "averageImportance",
        Number(
            scoreCam.mean_attention
        ).toFixed(6)
    );

    setText(
        "stdImportance",
        Number(
            scoreCam.std_attention
        ).toFixed(6)
    );


    // --------------------------------------------------------
    // FEATURE CONTRIBUTIONS
    // --------------------------------------------------------

    setText(
        "mfccContribution",
        Number(
            scoreCam.mfcc_contribution
        ).toFixed(2) + "%"
    );

    setText(
        "deltaContribution",
        Number(
            scoreCam.delta_contribution
        ).toFixed(2) + "%"
    );

    setText(
        "deltaDeltaContribution",
        Number(
            scoreCam.delta_delta_contribution
        ).toFixed(2) + "%"
    );


    // --------------------------------------------------------
    // CONTRIBUTION PROGRESS BARS
    // --------------------------------------------------------

    const mfccBar =
        document.getElementById(
            "mfccBar"
        );

    if (mfccBar) {

        mfccBar.style.width =
            scoreCam.mfcc_contribution + "%";

    }


    const deltaBar =
        document.getElementById(
            "deltaBar"
        );

    if (deltaBar) {

        deltaBar.style.width =
            scoreCam.delta_contribution + "%";

    }


    const deltaDeltaBar =
        document.getElementById(
            "deltaDeltaBar"
        );

    if (deltaDeltaBar) {

        deltaDeltaBar.style.width =
            scoreCam.delta_delta_contribution + "%";

    }


    // --------------------------------------------------------
    // IMPORTANT TIME REGIONS
    // --------------------------------------------------------

    const frameStart =
        scoreCam.important_frame_start;

    const frameEnd =
        scoreCam.important_frame_end;

    setText(
        "importantFrames",
        `${frameStart} – ${frameEnd}`
    );


    // --------------------------------------------------------
    // DOMINANT FEATURE
    // --------------------------------------------------------

    setText(
        "dominantFeature",
        scoreCam.dominant_feature
    );


    // --------------------------------------------------------
    // SCORE-CAM PENDING MESSAGE
    // --------------------------------------------------------

    const scoreCamPlaceholder =
        document.getElementById(
            "scoreCamPlaceholder"
        );

    if (scoreCamPlaceholder) {

        scoreCamPlaceholder.style.display =
            "none";

    }


    // --------------------------------------------------------
    // SCORE-CAM CONTAINER
    // --------------------------------------------------------

    const scoreCamVisualization =
        document.getElementById(
            "scoreCamVisualization"
        );

    if (scoreCamVisualization) {

        scoreCamVisualization.style.display =
            "block";

    }


    // --------------------------------------------------------
    // AI INTERPRETATION
    // --------------------------------------------------------

    const interpretationText =
        document.getElementById(
            "interpretationText"
        );

    if (interpretationText) {

        const prediction =
            scoreCam.target_class;

        const dominantFeature =
            scoreCam.dominant_feature;

        const startFrame =
            scoreCam.important_frame_start;

        const endFrame =
            scoreCam.important_frame_end;


        if (prediction === "REAL") {

            interpretationText.textContent =
                `The model classified this voice as GENUINE. ` +
                `Score-CAM indicates that ${dominantFeature} ` +
                `acoustic regions contributed most strongly to ` +
                `the REAL prediction, with the most important ` +
                `time region occurring around frames ` +
                `${startFrame}–${endFrame}.`;

        } else {

            interpretationText.textContent =
                `The model classified this voice as FAKE. ` +
                `Score-CAM indicates that ${dominantFeature} ` +
                `acoustic regions contributed most strongly to ` +
                `the FAKE prediction, with the most important ` +
                `time region occurring around frames ` +
                `${startFrame}–${endFrame}.`;

        }

    }


    console.log(
        "Score-CAM displayed successfully."
    );

}


// ============================================================
// ANALYZE BUTTON
// ============================================================

analyzeBtn.onclick = async function (event) {

    event.preventDefault();
    event.stopImmediatePropagation();


    console.log(
        "ANALYZE BUTTON CLICKED"
    );


    // --------------------------------------------------------
    // CHECK FILE
    // --------------------------------------------------------

    if (
        audioFile.files.length === 0
    ) {

        console.log(
            "NO FILE SELECTED"
        );

        alert(
            "Please select an audio file first."
        );

        return false;

    }


    const selectedFile =
        audioFile.files[0];


    console.log(
        "Sending file:",
        selectedFile.name
    );


    // --------------------------------------------------------
    // CREATE FORM DATA
    // --------------------------------------------------------

    const formData =
        new FormData();

    formData.append(
        "file",
        selectedFile
    );


    try {

        // ----------------------------------------------------
        // LOADING STATE
        // ----------------------------------------------------

        analyzeBtn.innerHTML =
            "Analyzing...";

        analyzeBtn.disabled =
            true;


        console.log(
            "Sending request to backend..."
        );


        // ----------------------------------------------------
        // SEND REQUEST
        // ----------------------------------------------------

        const response =
            await fetch(
                `${API_URL}/predict`,
                {
                    method: "POST",
                    body: formData
                }
            );


        console.log(
            "Backend response status:",
            response.status
        );


        // ----------------------------------------------------
        // CHECK RESPONSE
        // ----------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Backend returned ${response.status}`
            );

        }


        // ----------------------------------------------------
        // READ JSON
        // ----------------------------------------------------

        const data =
            await response.json();


        console.log(
            "BACKEND DATA:",
            data
        );


        // ----------------------------------------------------
        // MAIN RESULT
        // ----------------------------------------------------

        // --------------------------------------------------------
// MAIN RESULT
// --------------------------------------------------------

setText(
    "predictionText",
    data.prediction
);


// --------------------------------------------------------
// UPDATE PREDICTION ICON
// --------------------------------------------------------

if (predictionIcon) {

    if (data.prediction === "REAL") {

        predictionIcon.textContent = "✓";

        predictionIcon.className =
            "result-icon success-icon";

    }

    else if (data.prediction === "SUSPICIOUS") {

        predictionIcon.textContent = "!";

        predictionIcon.className =
            "result-icon warning-icon";

    }

    else {

        predictionIcon.textContent = "✕";

        predictionIcon.className =
            "result-icon danger-icon";

    }

}
// --------------------------------------------------------
// UPDATE RESULT COLOR THEME
// --------------------------------------------------------

if (resultOverview) {

    resultOverview.classList.remove(
        "real-result",
        "suspicious-result",
        "fake-result"
    );


    if (data.prediction === "REAL") {

        resultOverview.classList.add(
            "real-result"
        );

    }

    else if (data.prediction === "SUSPICIOUS") {

        resultOverview.classList.add(
            "suspicious-result"
        );

    }
    

    else {

        resultOverview.classList.add(
            "fake-result"
        );

    }

}


setText(
    "confidenceText",
    data.confidence + "%"
);


        // ----------------------------------------------------
        // VOICE INTEGRITY SCORE
        // ----------------------------------------------------

        setText(
            "integrityScore",
            data.voice_integrity_score
        );


        // ----------------------------------------------------
        // RISK LEVEL
        // ----------------------------------------------------

        setText(
            "riskText",
            data.risk_level.toUpperCase()
        );
        // --------------------------------------------------------
// UPDATE TOP RISK BADGE COLOR
// --------------------------------------------------------

if (riskBadge) {

    riskBadge.classList.remove(
        "risk-real",
        "risk-suspicious",
        "risk-fake"
    );


    if (data.prediction === "REAL") {

        riskBadge.classList.add(
            "risk-real"
        );

    }

    else if (data.prediction === "SUSPICIOUS") {

        riskBadge.classList.add(
            "risk-suspicious"
        );

    }

    else {

        riskBadge.classList.add(
            "risk-fake"
        );

    }

}

        setText(
            "riskLevelText",
            data.risk_level.toUpperCase()
        );


        // ----------------------------------------------------
        // FILE NAME
        // ----------------------------------------------------

        setText(
            "resultFileName",
            data.filename
        );


        // ----------------------------------------------------
        // SUMMARY
        // ----------------------------------------------------

        setText(
            "summaryPrediction",
            data.prediction
        );

        setText(
            "summaryConfidence",
            data.confidence + "%"
        );

        setText(
            "summaryIntegrity",
            data.voice_integrity_score +
            " / 100"
        );

        setText(
            "summaryRisk",
            data.risk_level.toUpperCase()
        );


        // ----------------------------------------------------
        // PREDICTION DESCRIPTION
        // ----------------------------------------------------

        const predictionDescription =
            document.getElementById(
                "predictionDescription"
            );


        if (predictionDescription) {

            if (
                data.prediction === "REAL"
            ) {

                predictionDescription.textContent =
                    "Voice classified as genuine.";

            } else {

                predictionDescription.textContent =
                    "Voice shows signs of synthetic generation.";

            }

        }


        // ----------------------------------------------------
        // SHOW RESULT
        // ----------------------------------------------------

        if (resultCard) {

            resultCard.style.display =
                "block";

        }


        // ----------------------------------------------------
        // SCORE-CAM
        // ----------------------------------------------------

        if (
            data.score_cam
        ) {

            displayScoreCAM(
                data.score_cam
            );

        } else {

            console.warn(
                "No Score-CAM data received."
            );

        }
        /* Update Voice Integrity Assessment */

updateIntegrityAssessment(
    data.voice_integrity_score
);


        console.log(
            "RESULT DISPLAYED"
        );


    } catch (error) {

        console.error(
            "ANALYSIS ERROR:",
            error
        );

        alert(
            "Analysis failed. Check the backend terminal and browser console."
        );


    } finally {

        // ----------------------------------------------------
        // RESTORE BUTTON
        // ----------------------------------------------------

        analyzeBtn.innerHTML =
            `Analyze Voice <span>→</span>`;

        analyzeBtn.disabled =
            false;

    }


    return false;

};
function updateIntegrityAssessment(score) {

    const scoreElement =
        document.getElementById("integrityAssessmentScore");

    const labelElement =
        document.getElementById("integrityAssessmentLabel");

    const progressElement =
        document.getElementById("integrityProgressFill");

    const descriptionElement =
        document.getElementById("integrityAssessmentDescription");


    if (!scoreElement ||
        !labelElement ||
        !progressElement ||
        !descriptionElement) {

        return;
    }


    const integrityScore =
        Math.max(0, Math.min(100, Number(score)));


    // Display actual score
    scoreElement.textContent =
    integrityScore.toFixed(2);


    // Update progress bar
    progressElement.style.width =
        `${integrityScore}%`;


    // Update assessment
    if (integrityScore >= 80) {

        labelElement.textContent =
            "Very High Integrity";

        descriptionElement.textContent =
            "The analyzed voice shows strong characteristics associated with genuine speech.";

    }

    else if (integrityScore >= 50) {

        labelElement.textContent =
            "Moderate Integrity";

        descriptionElement.textContent =
            "The analyzed voice contains characteristics that require additional attention.";

    }

    else {

        labelElement.textContent =
            "Low Integrity";

        descriptionElement.textContent =
            "The analyzed voice shows characteristics associated with potentially synthetic or manipulated speech.";

    }

}
// ============================================================
// REPORT HELPER FUNCTIONS
// ============================================================

function getText(id) {
    const element = document.getElementById(id);
    return element ? element.textContent : "--";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}
// ============================================================
// VIEW FULL REPORT
// ============================================================

const viewFullReportButton =
    document.getElementById("viewFullReportButton");

const reportModal =
    document.getElementById("reportModal");

const closeReportButton =
    document.getElementById("closeReportButton");

const closeReportButtonBottom =
    document.getElementById("closeReportButtonBottom");

const printReportButton =
    document.getElementById("printReportButton");


// ------------------------------------------------------------
// OPEN REPORT
// ------------------------------------------------------------

if (viewFullReportButton) {

    viewFullReportButton.addEventListener(
        "click",
        function () {

            // Make sure an analysis has been completed
            const resultCard =
                document.getElementById("resultCard");

            if (
                !resultCard ||
                resultCard.style.display === "none"
            ) {

                alert(
                    "Please analyze a voice recording first."
                );

                return;
            }


            // Copy current analysis values
            setText(
                "reportFileName",
                getText("resultFileName")
            );

            setText(
                "reportPrediction",
                getText("predictionText")
            );

            setText(
                "reportConfidence",
                getText("confidenceText")
            );

            setText(
                "reportIntegrity",
                getText("integrityScore")
            );

            setText(
                "reportRisk",
                getText("riskLevelText")
            );


            // Voice Analysis Summary

            setText(
                "reportSummaryPrediction",
                getText("summaryPrediction")
            );

            setText(
                "reportSummaryConfidence",
                getText("summaryConfidence")
            );

            setText(
                "reportSummaryIntegrity",
                getText("summaryIntegrity")
            );

            setText(
                "reportSummaryRisk",
                getText("summaryRisk")
            );


            // Score-CAM statistics

            setText(
                "reportPeakImportance",
                getText("peakImportance")
            );

            setText(
                "reportAverageImportance",
                getText("averageImportance")
            );

            setText(
                "reportStdImportance",
                getText("stdImportance")
            );


            // Feature contribution

            setText(
                "reportMfccContribution",
                getText("mfccContribution")
            );

            setText(
                "reportDeltaContribution",
                getText("deltaContribution")
            );

            setText(
                "reportDeltaDeltaContribution",
                getText("deltaDeltaContribution")
            );


            // Important regions

            setText(
                "reportImportantFrames",
                getText("importantFrames")
            );

            setText(
                "reportDominantFeature",
                getText("dominantFeature")
            );


            // AI interpretation

            setText(
                "reportInterpretation",
                getText("interpretationText")
            );


            // Copy Score-CAM image

            const scoreCamImage =
                document.getElementById(
                    "scoreCamImage"
                );

            const reportScoreCamImage =
                document.getElementById(
                    "reportScoreCamImage"
                );


            if (
                scoreCamImage &&
                reportScoreCamImage &&
                scoreCamImage.src
            ) {

                reportScoreCamImage.src =
                    scoreCamImage.src;

            }


            // Show report

            if (reportModal) {

                reportModal.style.display =
                    "block";

                document.body.style.overflow =
                    "hidden";

            }

        }
    );

}


// ------------------------------------------------------------
// CLOSE REPORT
// ------------------------------------------------------------

function closeFullReport() {

    if (reportModal) {

        reportModal.style.display =
            "none";

    }

    document.body.style.overflow =
        "";

}


// Top close button

if (closeReportButton) {

    closeReportButton.addEventListener(
        "click",
        closeFullReport
    );

}


// Bottom close button

if (closeReportButtonBottom) {

    closeReportButtonBottom.addEventListener(
        "click",
        closeFullReport
    );

}


// ------------------------------------------------------------
// CLOSE WHEN CLICKING OUTSIDE REPORT
// ------------------------------------------------------------

const reportOverlay =
    document.querySelector(
        ".report-modal-overlay"
    );


if (reportOverlay) {

    reportOverlay.addEventListener(
        "click",
        closeFullReport
    );

}


// ------------------------------------------------------------
// PRINT REPORT
// ------------------------------------------------------------

if (printReportButton) {

    printReportButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}