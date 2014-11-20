window.Ephemeris = {
    asteroid_2012_da14: {
        full_name: '2012 DA14',
        ma: 299.99868,
        epoch: 2456200.5,
        n: 0.98289640,
        a: 1.0018381,
        e: 0.1081389,
        i: 10.33722,

        w_bar: 58.33968,
        w: 271.07725,   // ARGUMENT of perihelion.  argument = longitude of perihelion - longitude of ascending node
        om: 147.26243,

        P: 365.256
    },

    // http://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
    // http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf
    mercury: {
        full_name: 'Mercury',
        ma: 174.79252722,
        epoch: 2451545.0,
        a: 0.38709927,
        e: 0.20563593,
        i: 7.00497902,
        w_bar: 77.45779628,
        w: 29.12703035,
        L: 252.25032350,
        om: 48.33076593,
        P: 87.969,
        R: 0.3829
    },
    venus: {
        full_name: 'Venus',
        ma: 50.37663232,
        epoch: 2451545.0,
        a: 0.72333566,
        e: 0.00677672,
        i: 3.39467605,
        w_bar: 131.60246718,
        w: 54.92262463,
        L: 181.97909950,
        om: 76.67984255,
        P: 224.701,
        R: 0.9499
    },
    earth: {
        full_name: 'Earth',
        ma: -2.47311027,
        epoch: 2451545.0,
        a: 1.00000261,
        e: 0.01671123,
        i: 0.00001531,
        w_bar: 102.93768193,
        w: 102.93768193,
        L: 100.46457166,
        //om:-11.26064,
        om: 0,
        P: 365.256,
        R: 1.00,
        mass: 3 * 10 ^ -6
    },
    mars: {
        full_name: 'Mars',
        ma: 19.39019754,
        epoch: 2451545.0,
        a: 1.52371034,
        e: 0.09339410,
        i: 1.84969142,
        w_bar: -23.94362959,   // longitude of perihelion
        w: -73.5031685,   // argument of perihelion
        L: -4.55343205,    // mean longitude
        om: 49.55953891,    // longitude of ascending node
        P: 686.980,
        R: 0.533
    },
    jupiter: {
        full_name: 'Jupiter',
        ma: 19.66796068,
        epoch: 2451545.0,
        a: 5.20288700,
        e: 0.04838624,
        i: 1.30439695,
        w_bar: 14.72847983,
        w: -85.74542926,
        L: 34.39644051,
        om: 100.47390909,
        P: 4332.589,
        R: 11.209
    },
    comet: {
        full_name: 'Halley',
        ma: 19.66796068,        // mean anomaly
        epoch: 2449400.5,       //                                                              might be able to not need
        a: 17.8,                //Semimajor axis                                                exoplanet might have
        e: 0.967,               //Eccentricity                                                  exoplanet might have
        i: 162.3,               //Inclination                                                   exoplanet might have
        w_bar: 169.752,     // longitude of perihelion(w + omega) Longitude of the periapsis    exoplanet might have
        w: 111.332,        // argument = (w + omega) - (omega)                                  if w_bar don't need
        L: 34.39644051,         // mean longitude                                               don't need
        om: 58.420,             //Longitude of the ascending node(omega)                        if w_bar don't need
        P: 27503.7768,          //Period                                                        exoplanet might have
        R: 5                    // radius                                                       nice to have
        //0.967, 17.80, 162.262,  58.420, 169.752,  75.300
        //e, a, i, Omega, (w + Omega), T
    }
};

for (var x in Ephemeris) {
    if (Ephemeris.hasOwnProperty(x) && Ephemeris[x].w_bar && Ephemeris[x].L) {
        Ephemeris[x].ma = Ephemeris[x].L - Ephemeris[x].w_bar;
    }
}
