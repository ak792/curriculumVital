//BEGINNING OF PROGRAM

/*
    TODO: 
        implement a help page/panel/textbox
        expand to more depts (aim for 10+)
        handle when too many courses at one height
        handle alternatives, corequisites, optional
        highlight connecting lines on mouseover
        make biggest gateway course take the full postrequisite chain
        handle slow internet
        figure out tooltips (currently all code with courseLabelsFullName* tries to do so)
        fade the highlighting of more distant prerequisites
        sorting by dept code not fullname
        algorithm to choose xCoord for course nodes should minimize the x distance travelled on all connections
*/

//when finished, minifi with http://www.jsmini.com/

console.log('starting program');


var DEFAULT_DEPT = 'acct'.toUpperCase(),
    WORKING_DEPTS = ['COSC', 'ACCT', 'MATH', 'MGMT', 'FINC', 'OPIM', 'MARK', 'STRT'],
    DEPT_FULL_NAMES = {
        'COSC' : 'Computer Science',
        'ACCT' : 'Accounting',
        'MATH' : 'Mathematics',
        'MGMT' : 'Management',
        'FINC' : 'Finance',
        'OPIM' : 'Operations & Information Management',
        'MARK' : 'Marketing',
        'STRT' : 'Strategy',
        'PSYC' : 'Psychology'
    };

var tracerCourse = '',
    start = Date.now(),
    courseInfosLoadedTracker = {
        courseInfos1: {
            iters: 0,
            APICALLS: 3
        },
        courseInfos2: {
            iters: 0,
            APICALLS: 1
        }
    },
    courseInfos = [],
    depts = WORKING_DEPTS;

init();

function init(){
    $('#visualization-placeholder').append('Loading...');
    getJSONs();
}

function getJSONs(){
    //Scrapes data from web
    //asynchronous - can't guarantee when/in which order these will finish
    try {
        var KIMLIMIT = 2500;
        for (var i = 0; i < courseInfosLoadedTracker.courseInfos1.APICALLS; i++) {
            $.ajax({
                "url": "https://www.kimonolabs.com/api/52iu90t2?apikey=q9qsiOhYXnYD55EBVnjx4wfoOJoSaqif&callback=processJSON&kimoffset=" + (KIMLIMIT * i),
                "crossDomain": true,
                "dataType": "jsonp"
            });
        }

        for (var i = 0; i < courseInfosLoadedTracker.courseInfos2.APICALLS; i++) {
            $.ajax({
                "url": "https://www.kimonolabs.com/api/680trsac?apikey=q9qsiOhYXnYD55EBVnjx4wfoOJoSaqif&callback=processJSON&kimoffset=" + (KIMLIMIT * i),
                "crossDomain": true,
                "dataType": "jsonp"
            });
        }
    } catch(err){
        console.error('Check your internet connection!');
    }

}

//Processes scraped data
function processJSON(data){
    console.log('loading ' + data.name + ' with ' + data.count + ' courses.');

    var courseInfosInJSON = [];

    for (var i = 0; i < data.results.collection1.length; ++i){
        var currDept = data.results.collection1[i].fullCourseTitle.substring(0, 4),
            currCourseNum = data.results.collection1[i].fullCourseTitle.substring(5, 8),
            currCourseName = data.results.collection1[i].fullCourseTitle.substring(9),
            currCourseDescription = data.results.collection1[i].courseDescription,
            currPrerequisitesLine;

        if (data.results.collection1[i].prerequisites !== undefined && data.results.collection1[i].prerequisites.substring(0,14) === 'Prerequisites:'){
            currPrerequisitesLine = data.results.collection1[i].prerequisites;
        }
        else if (data.results.collection1[i].credits !== undefined){
            if (typeof data.results.collection1[i].credits === 'string' && data.results.collection1[i].credits.substring(0,14) === 'Prerequisites:') {
                currPrerequisitesLine = data.results.collection1[i].credits;
            }
            else {
                for (propertyName in data.results.collection1[i].credits){
                    if (data.results.collection1[i].credits[propertyName] instanceof String && data.results.collection1[i].credits[propertyName].substring(0,14) === 'Prerequisites:'){
                        currPrerequisitesLine = data.results.collection1[i].credits[propertyName];
                    }
                }
            }
        }
        else {
            currPrerequisitesLine = '';
        }
        
        if (currDept === tracerCourse.substr(0,4) && currCourseNum === tracerCourse.substr(5,8)){
            console.error('here');
            console.error(currCourseDescription);
        }

        courseInfosInJSON.push(new Course(currDept, currCourseNum, currCourseName, currCourseDescription, currPrerequisitesLine));
    }

    if (data.name === 'CourseDetails'){
        apiName = 'courseInfos1';
    }
    else {
        apiName = 'courseInfos2';
    }

    courseInfosLoadedTracker[apiName].iters++;

    courseInfos = courseInfos.concat(courseInfosInJSON);
    processCourseInfos();
}


//*****************************
// Creates courseInfos object by combining the results of data in each JSON
// Removes duplicate Courses from the array, choosing the best prerequisitesLine to use
//****************************
function processCourseInfos(){
    console.log('started processCourseInfos, length: ' + courseInfos.length);

    //only runs when all the JSONs have been loaded
    if (courseInfosLoadedTracker.courseInfos1.iters === courseInfosLoadedTracker.courseInfos1.APICALLS
        && courseInfosLoadedTracker.courseInfos2.iters === courseInfosLoadedTracker.courseInfos2.APICALLS){

        var startProcessCourseInfos = Date.now();
        for (var i = 0; i < courseInfos.length; i++){
            loadDept(courseInfos[i]);
            for (var j = i + 1; j < courseInfos.length; j++){
                if (courseInfos[i].fullCourseNum === courseInfos[j].fullCourseNum){
                    if (courseInfos[i].prerequisitesLine === ''){
                        courseInfos[i].prerequisitesLine = courseInfos[j].prerequisitesLine;
                    }
                    if (typeof courseInfos[i].courseDescription !== 'string' ||
                            courseInfos[i].courseDescription === '' || 
                            courseInfos[i].courseDescription.toString().indexOf(':') < 14 ||
                            courseInfos[i].courseDescription.toString().indexOf(' ') - courseInfos[i].courseDescription.toString().indexOf(',') === 1) {
                        if (typeof courseInfos[j].courseDescription === 'string'){
                            courseInfos[i].courseDescription = courseInfos[j].courseDescription;
                        }
                    }                 
                    courseInfos.splice(j--, 1);
                }
            }
        }

        console.log('finished processCourseInfos in ' + (Date.now() - startProcessCourseInfos) + ' ms');
        processPrerequisiteLines();
    }
}

function loadDept(currCourseInfo){
/*
    if (depts.indexOf(currCourseInfo.dept.toString()) === -1){
        depts.push(currCourseInfo.dept);
    }

*/
}


//*****************************
// Populates prerequisites property of Courses by processing the prerequisiteLines of all Courses in courseInfos
//*****************************
function processPrerequisiteLines() {
    console.log('started processPrerequisiteLines');

    courseInfos.forEach(function (currCourse) {


        //pull out the appropriate prerequisite relationships from the prerequisite line
        if (currCourse.prerequisitesLine !== '' && currCourse.prerequisitesLine !== 'Prerequisites: None') {//if has a prerequisitesLine
            var courseRegExp = /([a-z]{4}[-\s]{0,5}\d{3})|(\d{3})/i,
                orRegExp = /\W+or\W+/i,
                normallyTakenAfterRegExp = /normally taken after/i,
                isRecommendedRegExp = /is recommended/i
                corequisiteRegExp = /(co-req)|(co-requisite)/i;

            if (courseRegExp.exec(currCourse.prerequisitesLine) != null){

                var postCourseStr = currCourse.prerequisitesLine;

                //problem: when the prerequisitesLine contains more than one course, two Requirements get added, each with ALL courses
                //expected: two Requirements get added, each with a single course
                while (courseRegExp.exec(postCourseStr) !== null) {
                    var currPrerequisites = [],
                        currRequirement = new Requirement(),
                        preCourseStr = RegExp.leftContext,
                        currPrereqStr = RegExp.lastMatch,
                        postCourseStr = RegExp.rightContext;

                    if (currPrereqStr.length === 3){
                        currPrereqStr = currCourse.dept + '-' + currPrereqStr;
                    }
                    else if (currPrereqStr.length !== 8){
                        currPrereqStr = currPrereqStr.slice(0,4) + '-' + currPrereqStr.slice(-3);
                    }
                    currRequirement.requirement.push(currPrereqStr);

                    if (normallyTakenAfterRegExp.exec(preCourseStr) !== null){
                        currRequirement.optional = true;
                    }  
                    if (corequisiteRegExp.exec(preCourseStr) !== null){
                        currRequirement.corequisite = true;
                    }                     

                    if (currCourse.fullCourseNum == tracerCourse){
                        console.error('preCourseStr: ' + preCourseStr);
                        console.error('currPrereqStr: ' + currPrereqStr);
                        console.error('postCourseStr: ' + postCourseStr);
                    }

                   //handles if there are alternatives
                    while (orRegExp.exec(postCourseStr)) {
                        postCourseStr = RegExp.rightContext;
                        //debug
                        if (currCourse.fullCourseNum == tracerCourse){
                           console.error('or token: ' + RegExp.lastMatch);
                        }
                        //breaks for arab-355 b/c multiple alternatives (x,y, or z) whereas this assumes only x or z
                        if (courseRegExp.exec(postCourseStr) !== null) {             //assumes if there is an 'or' token, whatever course follows is part of the alternatives (no mater how far it is)                            
                            preCourseStr = RegExp.leftContext;
                            currPrereqStr = RegExp.lastMatch;
                            postCourseStr = RegExp.rightContext;

                            if (currPrereqStr.length === 3){
                                currPrereqStr = currCourse.dept + ' ' + currPrereqStr;
                            }
                            currRequirement.requirement.push(currPrereqStr);

                            if (normallyTakenAfterRegExp.exec(preCourseStr) !== null){
                                currRequirement.optional = true;
                            }

                            if (currCourse.fullCourseNum == tracerCourse){
                                console.error(currPrereqStr);
                            }
                        }
                    }

                    var predicate = postCourseStr.slice(0);
                    if (courseRegExp.exec(predicate) != null){
                        predicate = RegExp.leftContext;
                    }
                    if (isRecommendedRegExp.exec(predicate) !== null){
                        currRequirement.optional = true;
                    }  
                    currCourse.prerequisites.push(currRequirement);

                    if (currCourse.fullCourseNum == tracerCourse){
                        console.error('pushing requirement: ' + currRequirement.requirement);
                        console.error('next postCourseStr: ' + postCourseStr);
                    }
                }

                if (currCourse.fullCourseNum == tracerCourse){
                    console.error(currCourse.prerequisites);
                }
            }
        }
    });

    //changes strings to Courses in prerequisites
    for (var i = 0; i < courseInfos.length; i++){
        for (var j = 0; j < courseInfos[i].prerequisites.length; j++) {
            for (var k = 0; k < courseInfos[i].prerequisites[j].requirement.length; k++) {
                for (var m = 0; m < courseInfos.length; m++) {
                    if (courseInfos[i].prerequisites[j].requirement[k].toString().substr(0, 4).toUpperCase() === courseInfos[m].dept.toUpperCase()
                            && courseInfos[i].prerequisites[j].requirement[k].toString().substr(5, 8) === courseInfos[m].courseNum) {
                        courseInfos[i].prerequisites[j].requirement[k] = courseInfos[m];
                        break;
                    }
                }

                if (courseInfos[i].fullCourseNum == tracerCourse){
                        console.error(courseInfos[i].prerequisites[j].requirement[k]);
                    }

                //if didn't find a course Object
                if (typeof courseInfos[i].prerequisites[j].requirement[k] == 'string') {                    
                    courseInfos[i].prerequisites[j].requirement.splice(k,1);
                }
            }

            if (courseInfos[i].prerequisites[j].requirement.length === 0){
                courseInfos[i].prerequisites.splice(j,1);
            }
        }
    }

    console.log('finished processPrerequisiteLines');
    loaded();
}

function loaded(){
    $('#course-box').append($('<div/>', {
        class: 'course-detail', 
        text: 'Click a course for more information!'
    }));

    $('h4').css('visibility', 'visible');
    $('#dept-select').css('visibility', 'visible');
    depts.sort();
    $.each(depts, function (i, dept) {
        $('#dept-select').append($('<option>', { 
            value: dept.toString(),
            text : DEPT_FULL_NAMES[dept].toString() 
        }));
    });

    visualizeData(DEFAULT_DEPT);  

    //END OF PROGRAM
    var stop = Date.now();
//    console.log('Full runtime: ' + (stop - start) + 'ms');
    console.log('stopping program');
}


//*****************************
// Outputs text representation of results to console
//*****************************

function outputResults(){
    console.log('started outputResults');
    console.log('courses in coursesInfo: ' + courseInfos.length);

    courseInfos.forEach(function(currCourseInfo){
        if (currCourseInfo.dept === DEFAULT_DEPT){
            console.log(currCourseInfo.prerequisites);
            currCourseInfo.prerequisites.forEach(function(currRequirement){
                console.log(currRequirement.requirement);
            })
            console.log(currCourseInfo.prerequisites.requirement);
  //          console.log(currCourseInfo.prerequisites.requirement + ' --> ' + currCourseInfo.fullCourseNum);
        }

    });
    //not sorted??
    console.log('finished outputResults');
}

