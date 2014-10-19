 function Course(dept, courseNum, courseName, courseDescription, prerequisitesLine){
     //instance properties
     this.dept = dept.toUpperCase();
     this.courseNum = courseNum;
     this.fullCourseNum = this.dept + '-' + this.courseNum;
     this.courseName = courseName;
     this.courseDescription = courseDescription;
     this.prerequisitesLine = prerequisitesLine;

     this.numConnections = -1;

     this.prerequisites = [];
 }

 //class properties/methods
 Course.prototype.toString = function(){
     return this.dept + '-' + this.courseNum;
 };

 function Requirement(){
 	this.requirement = [];
 	this.optional = false;
 	this.corequisite = false;
 }

  function createCourseFromCourse(otherCourse){
     var newCourse = new Course(otherCourse.dept, otherCourse.courseNum, otherCourse.courseName, 
          otherCourse.courseDescription, otherCourse.prerequisitesLine);

     if (otherCourse.prerequisites.length !== 0){
          newCourse.prerequisites = otherCourse.prerequisites;
     }

     return newCourse;
 }	