$("#dept-select").change(function() {

    $('div.dept-detail').remove();
    $('div.course-detail').remove();
    $('#course-box').append($('<div/>', {
        class: 'course-detail', 
        text: 'Click a course for more information!'
    }));
    visualizeData($(this).val());
})

function visualizeData(currDept) {
    console.log('started visualizeData');
    var RECT_MARGIN_HOR = 70,
        RECT_MARGIN_VERT = 74,
        RECT_WIDTH = 44,
        RECT_HEIGHT = 34,
        RECT_CORNER_ROUNDING_X = 5,
        RECT_CORNER_ROUNDING_Y = 5,
        VIS_FONT_SIZE = 12,
        UNDERGRAD_MAX_COURSE_NUM = 500;
;

    $('svg').remove();

    courseInfos.forEach(function(currCourseInfo){
        currCourseInfo.xCoord = undefined;
        currCourseInfo.yCoord = undefined;
        currCourseInfo.height = undefined;
        currCourseInfo.numConnections = -1;
    });

    var w = document.getElementById("visualization").offsetWidth,
        h = document.getElementById("visualization").offsetHeight,
        dataset = [],
        heights = [],
        leftmostRectXCoord = w + 1,
        rightmostRectXCoord = -1
        ;

    var svg = d3.select('#visualization')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');


    //set up tooltips, all are hidden at first
    var tooltip = svg
        .append('div')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        //  .style('background', 'lightsteelblue')
        .style('font-family', 'serif')
        .style('font-size', '8px')
        .text('myTooltip');


    setAllHeights();
    setRectCoords();
    
    var heightRects = svg.append('g')
        .selectAll('rect')
        .data(heights)
        .enter()
        .append('rect')
        .classed('height-rect', true);

    heightRects
        .attr('x', function(d){
            return leftmostRectXCoord - 1.2 * RECT_MARGIN_HOR;
        })
        .attr('y', function(d){
            return d.nodes[0].yCoord - RECT_HEIGHT / 2  - RECT_MARGIN_VERT / 10;           
        })
        .attr('width', function(d){
            return rightmostRectXCoord - leftmostRectXCoord + 2 * RECT_MARGIN_HOR;
        })
        .attr('height', function(d){
            return RECT_HEIGHT + 2 * RECT_MARGIN_VERT / 10;
        })
        .attr('rx', RECT_CORNER_ROUNDING_X)
        .attr('ry', RECT_CORNER_ROUNDING_Y);


    //connects nodes to each other
    //polyline extends from prerequisite to course, then next prerequisite then back to course, etc
    var connectingLines = svg.append('g')
        .selectAll('polyline')
        .data(dataset)
        .enter()
        .append('polyline')
        .attr('points', function(d){
            var points = [];
            for (var i = 0; i < d.prerequisites.length; i++){
                for (var j = 0; j < d.prerequisites[i].requirement.length; j++) {
                    if (typeof d.prerequisites[i].requirement[j].xCoord !== 'undefined') {
                        points.push(d.prerequisites[i].requirement[j].xCoord + ',' + d.prerequisites[i].requirement[j].yCoord);
                        points.push(d.xCoord + ',' + d.yCoord);
                    }
                }
            }
            return points.join(' ');
        })
        .classed('connecting-line', true)
        ;


    var heightLabels = svg.append('g')
        .selectAll('text')
        .data(heights)
        .enter()
        .append('text')
        .classed('height-label', true);

    heightLabels
        .text(
            function(d,i){
            return i + 1;
        }
        )
        .attr('x', function(d){            
            return leftmostRectXCoord - RECT_MARGIN_HOR; 
        })
        .attr('y', function(d){
            return d.nodes[0].yCoord + VIS_FONT_SIZE / 2;
        });



    //circles
    var rect = svg.append('g').selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('fill', '#A2E191');

    rect
        .attr('x', function (d) {
            return d.xCoord - RECT_WIDTH / 2;
        })
        .attr('y', function(d){
            return d.yCoord - RECT_HEIGHT / 2;
        })
        .attr('rx', function (d) {
            return RECT_CORNER_ROUNDING_X;
        })
        .attr('ry', function(d){
            return RECT_CORNER_ROUNDING_Y;
        })
        .attr('width', function(d){
            return RECT_WIDTH;
        })
        .attr('height', function(d){
            return RECT_HEIGHT;
        })
        .style('cursor', 'pointer')
        .on('mouseover.color', function (da) { 
            highlightPrereqChain(da, true);        
            return rect.filter(function(db){ 
                return db.highlight;   
            }).style('stroke', 'green').style('stroke-width', '5');
        })
        .on('mouseout.color', function (da) {           
            highlightPrereqChain(da, false);
            return rect.style('stroke', 'none');
        })
        .on('mouseover.tooltip', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltip', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('mouseover.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('click.debug)', function(d){
            console.log(d);
        })
        .on('mouseover.setCourseBoxText', function(d){
            setCourseBoxText(d);
        })
        ;

    //labels
    var courseLabels = svg.append('g').selectAll('text')
        .data(dataset)
        .enter()
        .append('text');
    courseLabels
        .text(function (d) {
            return d.dept;
        })
        .attr('x', function (d) {
            return d.xCoord;
        })
        .attr('y', function(d){
            return d.yCoord - VIS_FONT_SIZE * 1/6;
        })
        .style('cursor', 'pointer')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-family', '\'Raleway\', sans-serif')
        .on('mouseover.color', function (da) {
            //highlighted full prerequisite chain on mouseover
            highlightPrereqChain(da, true);
            return rect.filter(function(db){ return db.highlight;   }).style('stroke', 'green').style('stroke-width', '5');
        })
        .on('mouseout.color', function (da) {
            //dehighlights full prerequisite chain on mouseout
            highlightPrereqChain(da, false);
            return rect.style('stroke', 'none');
        })
        .on('mouseover.tooltip', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltip', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('mouseover.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('mouseover.setCourseBoxText', function(d){
            setCourseBoxText(d);
        });

    var courseLabels2 = svg.append('g').selectAll('text')
        .data(dataset)
        .enter()
        .append('text');
    courseLabels2
        .text(function (d) {
            return d.courseNum;
        })
        .attr('x', function (d) {
            return d.xCoord;
        })
        .attr('y', function(d){
            return d.yCoord + VIS_FONT_SIZE * 5/6;
        })  
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-family', '\'Raleway\', sans-serif')
        .style('cursor', 'pointer')
        .on('mouseover.color', function (da) {
            //highlighted full prerequisite chain on mouseover
            highlightPrereqChain(da, true);
            return rect.filter(function(db){ return db.highlight;   }).style('stroke', 'green').style('stroke-width', '5');
        })
        .on('mouseout.color', function (da) {
            //dehighlights full prerequisite chain on mouseout
            highlightPrereqChain(da, false);
            return rect.style('stroke', 'none');
        })
        .on('mouseover.tooltip', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltip', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('mouseover.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'visible') })
        .on('mouseout.tooltipBackground', function() { return setVisibility(courseLabelsFullName, 'hidden') })
        .on('mouseover.setCourseBoxText', function(d){
            setCourseBoxText(d);
        }); 

    var courseLabelsFullNameBackground = svg.append('g').selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect');
    courseLabelsFullNameBackground
        .attr('x', function (d) {
            return d.xCoord;
        })
        .attr('y', function(d){
            return d.yCoord + RECT_HEIGHT - 12;
        })
        .attr('width', function(d){
            return 20;
        })
        .attr('height', function(d){
            return 20;
        })
        .attr('rx', RECT_CORNER_ROUNDING_X)
        .attr('ry', RECT_CORNER_ROUNDING_Y)
        .style('background-color', '#58A9A7')
        .style('visibility', 'hidden')
        ;

    var courseLabelsFullName = svg.append('g').selectAll('div')
        .data(dataset)
        .enter()
        .append('div').classed('course-labels-full-name', true).style('background', 'lightsteelblue');
    courseLabelsFullName
        .text(function(d){
            return d.courseName;
        })
        .style('top', function (d) {
            return d.xCoord;
        })
        .style('left', function(d){
            return d.yCoord + RECT_HEIGHT;
        })
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-family', '\'Raleway\', sans-serif')
        .style('visibility', 'visible')
        ;

    

    setDeptBoxText();
    finish();

    //sets height in tree of all the courses
    function setHeight(currCourseInfo){
        var height;
        currCourseInfo.numConnections++;
        if (typeof currCourseInfo.height != 'undefined'){
            return currCourseInfo.height;
        }
        if (currCourseInfo.prerequisites.length <= 0){
            height = 0;
        }
        else {
            var max = -1;
            var temp;
            for (var i = 0; i < currCourseInfo.prerequisites.length; i++){
                for (var j = 0; j < currCourseInfo.prerequisites[i].requirement.length; j++){
                    //TODO: change to min of a req?
                    if (typeof currCourseInfo.prerequisites[i].requirement[j] !== 'string' //why would this  happen???
                            && currCourseInfo.prerequisites[i].requirement[j].dept.toUpperCase() === currDept 
                            && currCourseInfo.prerequisites[i].requirement[j].courseNum < UNDERGRAD_MAX_COURSE_NUM) {                    
                       temp = arguments.callee(currCourseInfo.prerequisites[i].requirement[j]);
                        currCourseInfo.numConnections++;
                    }
                    //if optional , ignore this one
                    //if coreq, = height
                    if (temp > max && currCourseInfo.dept.toUpperCase() === currDept && currCourseInfo.courseNum < UNDERGRAD_MAX_COURSE_NUM) {
                        max = temp;    
                    }
                }
            }
            height = 1 + max;
        }

        currCourseInfo.height = height;
        if (typeof heights[height] == 'undefined'){
            heights[height] = {
                nodes: [],
                nodesDrawn: 0,
                labelsDrawn: 0
            };
        }
        return height;
    }

    function setAllHeights(){
        courseInfos.filter(function(currCourseInfo) {
            if (currCourseInfo.dept.toUpperCase() == currDept.toUpperCase() && currCourseInfo.courseNum < UNDERGRAD_MAX_COURSE_NUM){
                return true;
            }
            return false;
        }).forEach(function(currCourseInfo){
            setHeight(currCourseInfo);
            dataset.push(currCourseInfo);
        });
    }

    function setRectCoords(){
       //adds a list of nodes at each height to the array of each height
        for (var i = 0; i < dataset.length; i++){
            heights[dataset[i].height].nodes.push(dataset[i]);
        }

        for (var i = 0; i < heights.length; i++){
            heights[i].nodes.sort(function(courseA, courseB){
                return courseB.numConnections - courseA.numConnections;
            })
        }

        for (var i = 0; i < heights.length; i++){
            for (var j = 0; j < heights[i].nodes.length; j++){
                if (heights[i].nodes.length % 2 === 1){
                    heights[i].nodes[j].xCoord = w / 2 + Math.pow(-1,j) * RECT_MARGIN_HOR * Math.ceil(j/2); 
                }
                else {
                    heights[i].nodes[j].xCoord = w / 2 + RECT_MARGIN_HOR / 2 + Math.pow(-1,j) * RECT_MARGIN_HOR * Math.ceil(j/2); 
                }

                if (heights[i].nodes[j].xCoord < leftmostRectXCoord){
                    leftmostRectXCoord = heights[i].nodes[j].xCoord;
                }

                if (heights[i].nodes[j].xCoord > rightmostRectXCoord){
                    rightmostRectXCoord = heights[i].nodes[j].xCoord;
                }

                middleIndex = Math.ceil((heights.length -1)/ 2);
                distFromMiddleIndex = Math.abs(middleIndex - i);
                var neg, currYCoord;
                if (middleIndex - i < 0){
                    neg = -1;
                }
                else {
                    neg = 1;
                }
                if (heights.length % 2 === 1){
                    currYCoord = h / 2 + neg * RECT_MARGIN_VERT * distFromMiddleIndex;
                }
                else {
                    currYCoord = h / 2 + RECT_MARGIN_VERT / 2 + neg * RECT_MARGIN_VERT * distFromMiddleIndex;
                }

                heights[i].nodes[j].yCoord = currYCoord;                
            }
        }
    }   

    function highlightPrereqChain(courseInfo, highlight){
        courseInfo.highlight = highlight;
        if (courseInfo.prerequisites.length == 0){
            return;
        }
        for (var i = 0; i < courseInfo.prerequisites.length; i++) {
            for (var j = 0; j < courseInfo.prerequisites[i].requirement.length; j++) {
                highlightPrereqChain(courseInfo.prerequisites[i].requirement[j], highlight);
            }
        }
    }

    function setDeptBoxText(){
        //better way = to get full postrequisite chain (this just gives immediate postrequisite)
        var biggestGatewayCourse = dataset[0];
        for (var i = 1; i < dataset.length; i++){
            if (dataset[i].numConnections - dataset[i].prerequisites.length > 
                    biggestGatewayCourse.numConnections - biggestGatewayCourse.prerequisites.length){
                biggestGatewayCourse = dataset[i];
            }
        }

        var sumHeights = 0;
        for (var i = 0; i < heights.length; i++){
            sumHeights += (heights[i].nodes.length * i);
        }

        var averageHeight = (sumHeights / dataset.length + 1).toFixed(1);

        var modeHeight = 0;
        for (var i = 0; i < heights.length; i++){
            if (heights[i].nodes.length > heights[modeHeight].nodes.length){
                modeHeight = i;
            }
        }

        var medianHeight = -1, medianNodeIndex = -1, nodesSoFar = -1;
        if (dataset.length % 2 === 1){
            medianNodeIndex = (dataset.length - 1) / 2;
            for (var i = 0; i < heights.length; i++){
                nodesSoFar += heights[i].nodes.length;
                if (nodesSoFar >= medianNodeIndex){
                    medianHeight = i;
                    break;
                }
            }
        }
        else {
            medianNodeIndex = Math.floor((dataset.length - 1)/2);
            for (var i = 0; i < heights.length; j++){
                nodesSoFar += heights[i].nodes.length;
                if (nodesSoFar = medianNodeIndex){
                    medianHeight = i + .5;
                    break;
                }
                else if (nodesSoFar > medianNodeIndex){
                    medianHeight = i;
                    break;
                }
            }
        }

        for (var i = 0; i < dataset.length; i++){
            if (dataset > heights[modeHeight].nodes.length){
                modeHeight = i;
            }
        }

        var details = [
            DEPT_FULL_NAMES[currDept],
            'Biggest Gateway Course: ' + biggestGatewayCourse,
            'Average Height: ' + averageHeight,
            'Median Height: ' + (medianHeight + 1),
            'Mode Height: ' + (modeHeight + 1),
            'Max Height: ' + heights.length
        ];


 /*       d3.select('#dept-curr')
            .text(details[0])
            .style('visibility','visible');
*/

        for (var i = 1; i < details.length; i++){
            d3.select('#dept-box')
                .append('div')
                .classed('dept-detail', true)
                .text(details[i])
        }
    }


    function setCourseBoxText(d){
        $('.course-detail').remove();
        var details = [
            d.courseName,
            d.fullCourseNum,
            d.courseDescription,
            d.prerequisitesLine
        ];

        for (var i = 0; i < details.length; i++){
            var currDiv = 
                d3.select('#course-box')
                    .append('div')
                    .classed('course-detail', true)
                    .text(details[i])

            if (i < 2){
                currDiv.style('font-weight', 'bold')
            }
        }
    }

    function setVisibility(elems, visible) {
        return; //remove when done
        return elems.filter(function(db){
            return db.highlight; 
        }).style('visibility', visible) 
    }


    function finish(){
        $('#visualization-placeholder').remove();
        console.log('finished visualizeData');
    }
}