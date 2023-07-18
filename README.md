# Itinerary Planning Tool

Competitive reservation systems and limited overnight options can be a headache when planning a trip. The Itinerary Planning Tool is designed for assisting the planning of multi-day backpacking, trail running, and/or bikepacking routes with restricted camping (i.e. parks where dispersed camping is prohibited). Whether you know exactly where you want to start, finish, and how many miles you are comfortable hiking each day, or if you want to generate a random itinerary for a short weekend, this app is here to help!

# How To Use

The more information you provide the tool, the better your results will be. However, if you don't know (or care) about a specific field, feel free to leave it blank. For the <b>Start and End Trailheads</b>, this can be done by selecting <b>No Preference</b> at the top of the list. For <b>Miles</b> and <b>Miles / Day</b>, this is done by setting the number to "0". To use the app, simply fill out as many of the four aforementioned fields as you choose, then optionally select the <b>Start Date</b> and <b>Half Day</b> checkbox.

The <b>Start and End Trailheads</b> are where you will start and end your hike. A trailhead indicates that there is road access or some other means of arriving. Typically, a trailhead offers parking and is the perfect location to plan a shuttle drop-off. 

Intuitively, the <b>Days</b> input is how many days you want to plan for your trip and the <b>Miles / Day</b> input is how many miles you prefer to cover each day. If <b>Days</b> is set, the resulting itinerary will always match. However, due to the unpredictable and irregular spacing of campsites, <b>Miles / Day</b> is typically used as a guideline to select each day and it will rarely align exactly. Rest assured, the generated itinerary will be as close to the provided number as statisically possible.

Are you planning on the first day being a <b>Half Day?</b> Check this box to force the app to select the nearest campsite to the starting trailhead for the first night. This is useful if you are starting your trip on a Friday after work and want to include an extra night of camping, but aren't planning a full day of hiking. Keep in mind, this does <i>not</i> add a half day to the number of <b>Days</b>, rather it is included in the input.

# How It Works

Depending on the supplied input, a variety of algorithms are used to generate the itinerary. To generate a route for a certain number of days, the app looks at the daily mileage of all possibilities and calculates the standard deviation of each. That is to say, it prioritizes the route with the most consistent daily mileage. So, at least from a purely mileage perspective, the optimal route is planned every time.

When fields are missing, the app does its best to fill in the gaps. Typically, this is done by finding all of the reasonable options, then selecting one at random. If you generate multiple routes with <b>No Preference</b> on the trailheads, you will likely see different outputs each time. 
