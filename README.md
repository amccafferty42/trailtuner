# Itinerary Planning Tool

Competitive reservation systems and limited overnight options can be a headache when planning a trip. The Itinerary Planning Tool is designed for assisting the planning of multi-day backpacking, trail running, and/or bikepacking routes with restricted camping (i.e. parks where dispersed camping is prohibited). Whether you know exactly where you want to start, finish, and how many miles you are comfortable hiking each day, or if you want to generate a random itinerary for a short weekend, this app is here to help!

# How To Use

The more information you provide the tool, the better your results will be. However, if you don't know (or care) about a specific field, feel free to leave it blank. For the start and end trailheads, this can be done by selecting "No Preference" at the top of the list. For miles and miles / day, this is done by setting the number to 0. To use the app, simply fill out as many of the 4 major fields as you choose, and optionally select the start date and half day checkbox.

The "Start and End Trailheads" are where you will start and end your hike. A trailhead indicates that there is road access or some other means of arriving. Typically, a trailhead offers parking and is the perfect location to plan a shuttle drop-off. 

Intuitively, the "Days" input is how many days you want to plan for your trip and the "Miles / Day" input is how many miles you prefer to cover each day. If "Days" is set, the resulting itinerary will always match. However, due to the unpredictable spacing of campsites, "Miles / Day" is typically used as a guideline and each day will rarely align exactly. Rest assured, the resulting itinerary will be as close to the provided number as statisically possible.

Are you planning on the first day being a "Half Day?" Check this box to force the app to select the nearest campsite to the starting trailhead for the first night. This is useful if you are starting your trip on a Friday after work and want to include an extra night of camping, but aren't planning a full day of hiking. Keep in mind, this does not add a half day to the number of "Days", it is included in the input.

# How It Works

Depending on the supplied input, a variety of algorithms are used to generate the itinerary. To compare different routes, the app looks at the daily mileage of all possibilities and calculates the standard deviation of each. That is, it prioritizes the route with the most consistent daily mileage. So, at least from a purely mileage perspective, the optimal route is planned every time.