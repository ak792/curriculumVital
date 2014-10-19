var courseInfosCosc = [];


var arr = [
    ['051',''],
    ['010',''],
    ['011',''],
    ['015',''],
    ['016',''],
    ['030','051'],
    ['052','051'],
    ['120','052'],
    ['150','052'],
    ['160',['052','030']],
    ['225','052'],
    ['280','052'],
    ['121','120'],
    ['240','160'],
    ['242','160'],
    ['252','160'],
    ['255',['160','121']],
    ['275','160'],
    ['285','160'],
    ['289','160']
]

for (var i = 0; i < arr.length; i++){

    var currCourse = new Course('','','','');
    currCourse.dept = 'COSC';
    currCourse.courseNum = arr[i][0];
    currCourse.fullCourseNum = currCourse.dept + '-' + currCourse.courseNum;
    currCourse.courseName = currCourse.fullCourseNum;
    currCourse.prerequisites = arr[i][1];
    if (typeof currCourse.prerequisites == 'string'){
        if (currCourse.prerequisites !== '') {
            currCourse.prerequisites = [currCourse.dept + '-' + currCourse.prerequisites];
        } else {
            currCourse.prerequisites = [];
        }
    }
    else if (currCourse.prerequisites == ''){
        currCourse.prerequisites = [];
    }
    else {
        for (var m = 0; m < currCourse.prerequisites.length; m++){
            currCourse.prerequisites[m] = currCourse.dept + '-' + currCourse.prerequisites[m];
        }
    }

    for (var k = 0; k < currCourse.prerequisites.length; k++) {
        for (var j = 0; j < courseInfosCosc.length; j++) {
            if (currCourse.prerequisites[k] === courseInfosCosc[j].fullCourseNum) {
                currCourse.prerequisites[k] = [courseInfosCosc[j]];
            }
        }
    }
    courseInfosCosc.push(currCourse);
}
