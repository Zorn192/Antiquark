// ==UserScript==
// @name         AntiQuark
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Automates some parts of Antimatter Dimensions
// @license      MIT
// @author       Hyppy
// @match        http://ivark.github.io/
// @match        https://ivark.github.io/
// @grant    GM_getValue
// @grant    GM_setValue
// @updateURL    https://openuserjs.org/src/scripts/Hyppy/AntiQuark.user.js
// @downloadURL  https://openuserjs.org/src/scripts/Hyppy/AntiQuark.user.js
// @homepage     https://openuserjs.org/scripts/Hyppy/AntiQuark
// ==/UserScript==

// ==OpenUserJS==
// @author Hyppy
// ==/OpenUserJS==

/*

AntiQuark - The Antimatter Dimensions Automator

v1.9 - Added Auto-Replicanti Galaxy feature
v1.8 - Boost/Shift purchases now wait 110ms to allow for bulk autobuys
v1.7a - Made Galaxy autobuy and Shift/Boost autobuy run indefinitely after breaking infinity
v1.7 - Auto Sac button added to automatically sacrifice at 100x.  Useful in some autobuy runs over 5-10s.
v1.6d - The script will now buy singles of a dimension in most scenarios if you have less than 10 already or are close to shift/boost
v1.6c - Why not make that stats bar draggable?  Sure thing.
v1.6b - Changed the window title to reflect the AntiQuark version
v1.6a - Moved the AntiQuark button to the right and fixed its position
v1.6 - Added a floating counter for the last 2 runs in the bottom left, toggleable in the AntiQuark menu
v1.5 - Added a new setting toggle, "Turbo Max All" - This clicks Max All every 1ms.
v1.43 - Fixed BigCrunch detection to allow for post-broken infinity automation
v1.42 - added HTTPS support - thanks /u/hawgie
v1.41 - corrected some logic in variable shift/boost condition. Reversed changelog chronology.
v1.4 - Added a variable shift/boost condition based on amount of times infinitied
v1.3 - Set tick rate of AntiQuark to 10ms, down from 200ms. Will monitor for performance problems.
v1.2 - Disable sacrifices if sacrifice notification is enabled. Allows for easy completion of an achievement.
v1.1a - Cleaned up a lot of code and added more comments
v1.1 - Completely rewrote Autobuy Tickspeed challenge logic.  Completed in just over an hour at 180 IP.
v1.03 - More edits to AUtobuy Tickspeed challenge. Still testing if it can complete.  Definitely not optimal.
v1.02 - Fixed bug in shift/boost detection
v1.0 - Added logic to complete Autobuy Tickspeed challenge
       Corrected logic for buying 1 of a dimension for shifts/boosts
v0.9 - Added metadata for updates
v0.8 - Added autobuy-2 challenge logic that waits until 20s between any purchases unless all buys are available
       Updated smartmax function to buy new dimensions or a single dimension for a shift requirement
       Cleaned up some if statements
v0.7 - Consolidated autobuy-8 challenge logic into main loop, added auto-crunch toggle
v0.6 - Added logic for certain challenges in the standard function
v0.5a - bug fix on standard run logic
v0.5 - Updated logic for standard runs
v0.4 - Added automation of standard non-challenge runs
v0.3a - Just adding comments for readibility and maintainability
v0.3 - Created an AntiQuark tab to contain settings and toggles.  Currently only housing automated dimension 8 autobuy challenge
v0.2 - Added logic to repeat the challenge once finished, as well as disable the automation if the challenge is not active
v0.1 - Automated the Dimension 8 Autobuy challenge that's useful from IP1 to IP6


TODO:
- Extend into further challenges as I encounter them

*/



(function() {
    'use strict';

    // ****************
    // GLOBAL VARIABLES
    // ****************

    var VERSION = "1.9";
    var ABcount = 0; // For Autobuy-2 Challenge
    var Boostcount = 0; // Counter for delayed shift/boosts after breaking infinity

    // **************
    // HTML ADDITIONS
    // **************

    // AntiQuark button and tab
    $('body').append('<button id="antiquarkbtn" style="font-family: Typewriter; font-size: 20px; display: block;" class="tabbtn">AntiQuark</button>');
    $("#antiquarkbtn").css("position", "fixed").css("right", "0%").css("bottom", "10%").css("transform", "translate(-50%, -50%)");
    $('body').append('<div id="antiquark" class="tab" style="display: none;">' +
                     '<br><br><br>' +
                     '<center><input type="button" class="secondarytabbtn" id="AutoStandard" title="Automates normal runs for infinity points. Able to handle most challenges except tickspeed"></center>' +
                     '<center><input type="button" class="secondarytabbtn" id="AutoCrunch" title="Enables automatic Big Crunch clicks at the end of a run"></center>' +
                     '<center><input type="button" class="secondarytabbtn" id="TurboMaxAll" title="Enables just turbo mashing of Max All, helpful after broken infinity"></center>' +
                     '<center><input type="button" class="secondarytabbtn" id="StatsFloater" title="Enables a floating stats window for the last 2 runs"></center>' +
                     '<center><input type="button" class="secondarytabbtn" id="AutoSacrifice" title="Automatically sacrifices at 100x, triggered every 0.2s"></center>' +
                     '<center><input type="button" class="secondarytabbtn" id="AutoReplicanti" title="Automatically performs a Replicanti Galaxy reset"></center>' +
                     '<br><br><br><center>AntiQuark v' + VERSION + ' - <a href="https://openuserjs.org/scripts/Hyppy/AntiQuark">https://openuserjs.org/scripts/Hyppy/AntiQuark</a></center>' +
                     '</div>');

    // Last Run floating text
    $('body').append('<div id="lastrunfloat" style="font-family: Typewriter; font-size: 10px; border: 1px solid black; cursor: move; padding:5px; background: white"></div>');
    $("#lastrunfloat").css("position", "absolute").css("left", "1%").css("top", "87%");

    // Set the button names according to loaded preferences on pageload
    if(GM_getValue("AutoStandardEnabled") == '1'){             // Name the button for Auto-Standard
        document.getElementById("AutoStandard").value = "Automate Runs On";
    } else {
        document.getElementById("AutoStandard").value = "Automate Runs Off";
    }

    if(GM_getValue("AutoCrunchEnabled", '1') == '1'){              // Name the button for Auto-Crunch
        document.getElementById("AutoCrunch").value = "Auto Crunch On";
    } else {
        document.getElementById("AutoCrunch").value = "Auto Crunch Off";
    }

    if(GM_getValue("TurboMaxAllEnabled", '0') == '1'){              // Name the button for Auto-Crunch
        document.getElementById("TurboMaxAll").value = "Turbo Max All On";
    } else {
        document.getElementById("TurboMaxAll").value = "Turbo Max All Off";
    }

    if(GM_getValue("StatsEnabled", '1') == '1'){              // Name the button for Stats Floater
        document.getElementById("StatsFloater").value = "Run Stats On";
        $("#lastrunfloat").css("display", "block");
    } else {
        document.getElementById("StatsFloater").value = "Run Stats Off";
        $("#lastrunfloat").css("display", "none");
    }

    if(GM_getValue("AutoSacrificeEnabled", '0') == '1'){              // Name the button for Auto Sac
        document.getElementById("AutoSacrifice").value = "Auto Sac On";
    } else {
        document.getElementById("AutoSacrifice").value = "Auto Sac Off";
    }

    if(GM_getValue("AutoReplicantiEnabled", '0') == '1'){              // Name the button for Auto Replicanti
        document.getElementById("AutoReplicanti").value = "Auto Replicanti On";
    } else {
        document.getElementById("AutoReplicanti").value = "Auto Replicanti Off";
    }


    // ****************
    // BUTTON FUNCTIONS
    // ****************

    document.getElementById("antiquarkbtn").onclick = function () { // Enables the AntiQuark tab
        showTab('antiquark');
    };
    $('#AutoStandard').click(function(){                           // Toggles Auto-Standard functionality
        if (GM_getValue("AutoStandardEnabled", '0') != '1'){
            GM_setValue("AutoStandardEnabled", '1');
            document.getElementById("AutoStandard").value = "Automate Runs On";
        } else {
            GM_setValue("AutoStandardEnabled", '0');
            document.getElementById("AutoStandard").value = "Automate Runs Off";
        }
    });
    $('#AutoCrunch').click(function(){                           // Toggles Auto-Crunch functionality
        if (GM_getValue("AutoCrunchEnabled", '1') != '1'){
            GM_setValue("AutoCrunchEnabled", '1');
            document.getElementById("AutoCrunch").value = "Auto Crunch On";
        } else {
            GM_setValue("AutoCrunchEnabled", '0');
            document.getElementById("AutoCrunch").value = "Auto Crunch Off";
        }
    });
    $('#TurboMaxAll').click(function(){                           // Toggles Turbo MaxAll functionality
        if (GM_getValue("TurboMaxAllEnabled", '0') != '1'){
            GM_setValue("TurboMaxAllEnabled", '1');
            document.getElementById("TurboMaxAll").value = "Turbo Max All On";
        } else {
            GM_setValue("TurboMaxAllEnabled", '0');
            document.getElementById("TurboMaxAll").value = "Turbo Max All Off";
        }
    });
    $('#StatsFloater').click(function(){                           // Toggles Stats Floater functionality
        if (GM_getValue("StatsEnabled", '0') != '1'){
            GM_setValue("StatsEnabled", '1');
            document.getElementById("StatsFloater").value = "Run Stats On";
            $("#lastrunfloat").css("display", "block");
        } else {
            GM_setValue("StatsEnabled", '0');
            document.getElementById("StatsFloater").value = "Run Stats Off";
            $("#lastrunfloat").css("display", "none");
        }
    });
    $('#AutoSacrifice').click(function(){                           // Toggles Auto Sac functionality
        if (GM_getValue("AutoSacrificeEnabled", '0') != '1'){
            GM_setValue("AutoSacrificeEnabled", '1');
            document.getElementById("AutoSacrifice").value = "Auto Sac On";
        } else {
            GM_setValue("AutoSacrificeEnabled", '0');
            document.getElementById("AutoSacrifice").value = "Auto Sac Off";
        }
    });
    $('#AutoReplicanti').click(function(){                           // Toggles Auto Replicanti functionality
        if (GM_getValue("AutoReplicantiEnabled", '0') != '1'){
            GM_setValue("AutoReplicantiEnabled", '1');
            document.getElementById("AutoReplicanti").value = "Auto Replicanti On";
        } else {
            GM_setValue("AutoReplicantiEnabled", '0');
            document.getElementById("AutoReplicanti").value = "Auto Replicanti Off";
        }
    });


    // *****************
    // UTILITY FUNCTIONS
    // *****************

    // bigcrunch - Just does the crunch if we're allowed to.
    function bigcrunch(){
        if (GM_getValue("AutoCrunchEnabled", '1') == '1') {
            document.getElementById('bigcrunch').click();
            ABcount = 0;  // resets counter for Autobuy-2 challenge. Might not be necessary.
        }
    }

    // shiftbump - Looks for any single-dimension buys that either give us a quicker soft reset or are the first of their kind. I can probably rewrite this with a loop someday.
    function shiftbump(){
        if (player.eightAmount < '10' || (getShiftRequirement(0).tier == '8' && (player[TIER_NAMES[getShiftRequirement(0).tier] + 'Amount'] >= getShiftRequirement(0).amount - 9))){
            if (document.getElementById('eight').className == 'storebtn') document.getElementById('eight').click();
        }
        if (player.seventhAmount < '10' || (getShiftRequirement(0).tier == '7' && (player[TIER_NAMES[getShiftRequirement(0).tier] + 'Amount'] >= getShiftRequirement(0).amount - 9))){
            if (document.getElementById('seventh').className == 'storebtn') document.getElementById('seventh').click();
        }
        if (player.sixthAmount < '10' || (getShiftRequirement(0).tier == '6' && (player[TIER_NAMES[getShiftRequirement(0).tier] + 'Amount'] >= getShiftRequirement(0).amount - 9))){
            if (document.getElementById('sixth').className == 'storebtn') document.getElementById('sixth').click();
        }
        if (player.fifthAmount < '10' || (getShiftRequirement(0).tier == '5' && (player[TIER_NAMES[getShiftRequirement(0).tier] + 'Amount'] >= getShiftRequirement(0).amount - 9))){
            if (document.getElementById('fifth').className == 'storebtn') document.getElementById('fifth').click();
        }
        if (player.fourthAmount < '10' || (getShiftRequirement(0).tier == '4' && (player[TIER_NAMES[getShiftRequirement(0).tier] + 'Amount'] >= getShiftRequirement(0).amount - 9))){
            if (document.getElementById('fourth').className == 'storebtn') document.getElementById('fourth').click();
        }
        if (player.thirdAmount < '10'){
            if (document.getElementById('third').className == 'storebtn') document.getElementById('third').click();
        }
        if (player.secondAmount < '10'){
            if (document.getElementById('second').className == 'storebtn') document.getElementById('second').click();
        }
    }


    // findSafeUpgrade - a function for the tickspeed challenge mode that returns a number (1, 2, etc) of the lowest cost "safe" upgrade, or 0 if none exists.
    function findSafeUpgrade(){
        var safe = [null, 1, 1, 1, 1, 1, 1, 1, 1];  // Array indicating safety of the tiers. Assume upgrades are safe until proven otherwise.
        var lowexponent = 309; // Sets a base to compare lowest exponent cost
        var safeitem = 0; // safeitem 0 means that there are no safe upgrades. Default to return.
        for (var i = 1; i <= getShiftRequirement(0).tier; i++) {   // Scan through pairs of dimensions.
            for (var j = 1; j <= getShiftRequirement(0).tier; j++)  // Compares the cost of the dimension's NEXT exponent versus all other dimensions to determine safety
                if ((player[TIER_NAMES[i] + 'Cost'].exponent + getDimensionCostMultiplier(i).exponent) == player[TIER_NAMES[j] + 'Cost'].exponent) {
                    safe[i] = 0;  // If we match NEXT cost with another dimension's current cost, the upgrade is not safe
                }
        }
        for (var k = 1; k <= getShiftRequirement(0).tier ; k++) { // Now we scan through the safe upgrades to determine the lowest cost one available
            if (safe[k] == '1') {
                if ( player[TIER_NAMES[k] + 'Cost'].exponent < lowexponent){
                    lowexponent = player[TIER_NAMES[k] + 'Cost'].exponent;   // Replace the comparison benchmark with the new "lowest cost" safe upgrade's
                    safeitem = k;
                }
            }
        }
        return safeitem; // Returns the lowest cost safe upgrade, or 0 if there are no safe upgrades.
    }

    // tickhallenge - Autobuy Tickspeed Challenge core logic.
    function tickChallenge() {
        var safeUpgrade = findSafeUpgrade(); // get the lowest cost upgrade that won't create a duplicate cost, which returns 0 if none exists
        if (safeUpgrade > 0) { // If there is a safe upgrade, try to do it
            if (document.getElementById(TIER_NAMES[safeUpgrade]).className == 'storebtn') document.getElementById([TIER_NAMES[safeUpgrade] + 'Max']).click();
        } else {  // Otherwise, try either Dim8 or Dim6.  The only reason they wouldn't be safe is if a lower level one matched, which is okay.
            if (document.getElementById('eightMax').className == 'storebtn') document.getElementById('eightMax').click();
            if (document.getElementById('sixthMax').className == 'storebtn') document.getElementById('sixthMax').click();
        }
        for (var i = 1; i <= getShiftRequirement(0).tier; i++) {  // Loop through all available dimensions to check for cheap upgrades
            if ((player[TIER_NAMES[i] + 'Cost'].exponent + 13) < player.money.exponent) {   // If we have 1e13 times the money needed for an upgrade, do it even if it's unsafe
                if (document.getElementById([TIER_NAMES[i] + 'Max']).className == 'storebtn') {
                    document.getElementById([TIER_NAMES[i] + 'Max']).click();
                    return; // Return after doing a non-safe upgrade in case a new safe one opens up
                }
            }
        }
        for ( var j = 1; j <= getShiftRequirement(0).tier; j++)  {   // Check if tickspeed cost is higher than any dimension's cost. If it is, exit this function.
            if (player.tickSpeedCost.exponent >= player[TIER_NAMES[j] + 'Cost'].exponent) return;
        }
        if (document.getElementById('tickSpeed').className == 'storebtn') document.getElementById('tickSpeed').click(); // Catch tickspeed cost up to the lowest dimension cost.
    }

    // smartmax - tries to intelligently buy things instead of just blasting Max All.  Accounts for some challenges as needed.
    function smartmax(){
        if (player.firstAmount.mantissa == '0'){
            document.getElementById('first').click();  // Buy dimension 1 if we're just starting
            document.getElementById('firstMax').click(); // Heck, try and buy them all if we can.
        }
        if (player.currentChallenge == 'challenge5') { // Move to tickspeed challenge function
            shiftbump();  // We always prioritize a purchase that would net us a shift/galaxy/boost.
            tickChallenge();  // Call the tickspeed autobuy challenge logic
            return;  // Do nothing else.  We don't want to make any mistaken purchases.
        }
        if (player.currentChallenge == 'challenge2') {  // Autobuy-2 challenge framwork.
            if ((document.getElementById('eightMax').className == 'storebtn' || player.eightAmount.mantissa == '0') &&
                (document.getElementById('seventhMax').className == 'storebtn' || player.seventhAmount.mantissa == '0') &&
                (document.getElementById('sixthMax').className == 'storebtn' || player.sixthAmount.mantissa == '0') &&
                (document.getElementById('fifthMax').className == 'storebtn' || player.fifthAmount.mantissa == '0') &&
                (document.getElementById('fourthMax').className == 'storebtn' || player.fourthAmount.mantissa == '0') &&
                (document.getElementById('thirdMax').className == 'storebtn' || player.thirdAmount.mantissa == '0') &&
                (document.getElementById('secondMax').className == 'storebtn' || player.secondAmount.mantissa == '0') &&
                (document.getElementById('firstMax').className == 'storebtn' || player.firstAmount.mantissa == '0')) {
                document.getElementById('maxall').click(); // That massive if statement above just checks to see if we can safely Max All early because everything is already available;
                ABcount = 0;
                return;
            }
            if (ABcount < 2000) { // Otherwise, we do a count to 2000 (20s * 1/100 second interval) until we allow the rest of the logic to happen.
                ABcount = ABcount + 1;
                return;
            } else {
                ABcount = 0;
            }
        }
        shiftbump(); // Double check if there are any available quick shift/boost opportunities before Max All
        if (document.getElementById('firstMax').className == 'storebtn') document.getElementById('firstMax').click(); // Always go for doubling our income before Max All
        document.getElementById('maxall').click();          // Use the basic Max All button after all of the above.
    }

    // smartsacrifice - performs dimensional sacrifices at somewhat reasonable times.
    function smartsacrifice(){
        if(player.currentChallenge != 'challenge11'){
            if (calcSacrificeBoost().mantissa > '5' || (calcSacrificeBoost().mantissa > '2' && calcTotalSacrificeBoost != '1')) {
                if (!player.options.sacrificeConfirmation) document.getElementById('sacrifice').click();   // Normal runs sacrifice at 5x first, then every 2x
            }
        } else { // The logic to determine when to sacrifice in Autobuy-8.  Pretty basic and hamfisted, extending sacrifices as we move forward
            if ((calcSacrificeBoost().mantissa > '2' && getDimensionFinalMultiplier(8).exponent < 5) ||  // If sacrifice is more than 2x and we have less than 1e5 multiplier on dimension 8
                (calcSacrificeBoost().mantissa > '3' && getDimensionFinalMultiplier(8).exponent < 12) || // If sacrifice is more than 3x and we have less than 1e12 multiplier on dimension 8
                (calcSacrificeBoost().mantissa > '5' && getDimensionFinalMultiplier(8).exponent < 20) || // If sacrifice is more than 5x and we have less than 1e20 multiplier on dimension 8
                calcSacrificeBoost().exponent > '0' ) {  // Or always sacrifice at 10x
                if (!player.options.sacrificeConfirmation) document.getElementById('sacrifice').click();
            }
        }
    }

    // smartgalaxy - will try to buy a galaxy if we want one
    function smartgalaxy(){
        if(player.currentChallenge == 'challenge11') return; // Exit out if we're in Autobuy 8 challenge. Galaxies are useless there.
        if(player.break) document.getElementById('secondSoftReset').click(); // If we've broken Infinity, then just keep buying galaxies when available
        if (player.infinityUpgrades.includes("galaxyBoost") && player.currentChallenge != 'challenge6' && player.currentChallenge != 'challenge4' && player.currentChallenge != 'challenge7') {
            if (player.galaxies == '0') document.getElementById('secondSoftReset').click(); // Buy 1 galaxy if 2x galaxy boost is purchased, but NOT if in Autobuy 5, Autobuy Galaxy, or Autobuy Crunch challenges
        } else {
            if (player.galaxies < '2') document.getElementById('secondSoftReset').click(); // Buy 2 galaxies if 2x galaxy boost is NOT purchased
        }
    }

    // smartreset - will try to perform a shift or boost if we want one
    function smartreset(){
        Boostcount++;
        if ((Boostcount <= 9) && player.break) return; // Only try to shift/boost every 11 cycles (110ms) after breaking infinity, allowing bulk autobuyers to take priority
        Boostcount = 0;
        var resetcount = 15; // Set dimension boost threshold based on infinities completed.  15 is the 176/185 dim8 threshold.
        if (player.infinitied > 10) resetcount = 11;
        if (player.infinitied > 100) resetcount = 8;
        if (player.infinitied > 500) resetcount = 5;
        if (player.break) resetcount = 99999; // If we've broken Infinity, just keep going.

        if (player.currentChallenge == 'challenge11') {
            if (player.resets < '5') document.getElementById('softReset').click(); // In Autobuy 8 challenge if we haven't enable sacrifices yet, then soft reset whenever available
            return;
        }
        if ((player.resets < resetcount) || (player.currentChallenge == 'challenge4')) document.getElementById('softReset').click(); // Soft Reset until identified requirement, or when available if in autobuy Galaxy challenge
    }

    // *****************************
    // MAIN "AUTO-STANDARD" FUNCTION
    // *****************************
    function autoStandard(){
        if (GM_getValue("AutoStandardEnabled") == '1'){         // Only runs when enabled
            if ((player.money.gte(Number.MAX_VALUE))  && (GM_getValue("AutoCrunchEnabled", '1') == '1')) { // If we've reached Infinity, do a big crunch
                bigcrunch();
                return;
            }
            smartmax();  // Buy tickspeed or dimensions, based on logic that looks at challenges, costs, and optimal paths
            smartsacrifice();  // Sacrifice if it's beneficial
            smartgalaxy(); // Buy a galaxy if we need it and can afford it
            smartreset(); // Shift or boost if we need it and can afford it.
        }
    }

    // *****************************
    // MAIN "TURBO MAX ALL" FUNCTION
    // *****************************

    function turboMaxAll(){
        if (GM_getValue("TurboMaxAllEnabled", '0') == '1') document.getElementById('maxall').click();
    }



    // ****************************
    // MAIN "UPDATE STATS" FUNCTION
    // ****************************
    function updateStats(){
        document.getElementById("lastrunfloat").innerHTML = document.getElementById("run1").innerHTML + "<br>" + document.getElementById("run2").innerHTML;  // Grabs the last 2 run stats HTML from the game's stats menu
    }

    // *************************
    // MAIN "SET TITLE" FUNCTION
    // *************************
    function setTitle() {
        document.title = 'Antimatter Dimensions - AntiQuark v' + VERSION;
    }

    // *************************
    // MAIN "AUTO SACRIFICE" FUNCTION
    // *************************
    function autoSacrifice() {
        if (GM_getValue("AutoSacrificeEnabled") == '1') {
            if (calcSacrificeBoost().exponent >= '2') document.getElementById('sacrifice').click();
        }
    }

    // *************************
    // MAIN "AUTO REPLCIANTI" FUNCTION
    // *************************
    function autoReplicanti() {
        if (GM_getValue("AutoReplicantiEnabled") == '1') {
            if (document.getElementById('replicantireset').className == 'storebtn') document.getElementById('replicantireset').click();
        }
    }

    // *****************************
    // DRAGGABLE STATS BAR FUNCTIONS
    // *****************************
    dragElement(document.getElementById(("lastrunfloat")));
    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        elmnt.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e = e || window.event;    // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;    // removes action when the mouse button is raised
            document.onmousemove = elementDrag;    // call a function whenever the cursor moves:
        }
        function elementDrag(e) {
            e = e || window.event;
            pos1 = pos3 - e.clientX; // calculate the new cursor position
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; // set the element's new position
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
        function closeDragElement() { // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Enable main functions
    setInterval(autoStandard, 10);               // Sets the Auto-Standard (main loop) activity timer to every 10ms
    setInterval(turboMaxAll, 1);                 // Sets the Turbo Max All activity timer to every 1ms
    setInterval(updateStats, 100);               // Sets the stats update activity timer to every 100ms
    setInterval(setTitle, 1000);                 // Sets the title every 1s
    setInterval(autoSacrifice, 200);             // Sets Auto Sac to every 0.2s
    setInterval(autoReplicanti, 10);           // Sets Auto Replicanti every 1s

})();
