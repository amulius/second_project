from django import template
import math

register = template.Library()


# make planet id from distance ---

def orbit_calc(period, star_mass):
    grav = 1.327 * 10**11
    return math.pow((((float(period) * 24 * 60 * 60)/(2 * math.pi))**2 * (float(star_mass) * grav)), 1.0/3) / 149597871


def period_calc(au, star_mass):
    grav = 1.327 * 10**11
    return (2 * math.pi * math.sqrt(float(au * 149597871)**3 / (float(star_mass) * grav)))  #(24 * 60 * 60)



@register.filter
def planet_text(name):
    return '{}'.format(name)


@register.filter
def planet_name(number):
    return 'planet{}'.format(number)


@register.filter
def planet_speed(number):
    return '#planet{}speed'.format(number)


@register.filter
def planet_id(number):
    return '#planet{}'.format(number)


@register.filter
def planet_class(number):
    return '.planet{}'.format(number)


@register.filter
def planet_shadow(number):
    return 'planet{}-shadow'.format(number)


# adjust model size from base of jupiter


@register.filter
def scale_stretch_size(size):
    adjust = 12 * float(size)
    return '{}em'.format(adjust)


@register.filter
def scale_d_size(size):
    adjust = 4.19466 * float(size)
    return '{}em'.format(adjust)


@register.filter
def scale_s_size(size):
    adjust = 41.9466 * float(size)
    return '{}em'.format(adjust)


@register.filter
def sun_scale_stretch_size(size):
    # adjust = 24 * float(size)
    adjust = 24 * float(size)
    return '{}em'.format(adjust)


@register.filter
def sun_scale_d_size(size):
    adjust = 41.73048 * float(size)
    return '{}em'.format(adjust)


@register.filter
def sun_scale_s_size(size):
    adjust = 417.3048 * float(size)
    return '{}em'.format(adjust)


# adjust model orbit from base of earth since units of AUs


@register.filter
def scale_stretch_orbit(au):
    # adjust = 56 * float(au)
    adjust = 5.952556919 * float(au) + 55.5253009955
    return '{}em'.format(adjust)

@register.filter
def scale_stretch_orbit_half(au):
    # adjust = -28 * float(au)
    adjust = -0.5 * (5.952556919 * float(au) + 55.5253009955)
    return '{}em'.format(adjust)


@register.filter
def scale_d_orbit(au):
    # adjust = 49.50959 * float(au)
    adjust = 7.7902731817 * float(au) + 41.7652462792
    return '{}em'.format(adjust)


@register.filter
def scale_d_orbit_half(au):
    # adjust = -24.75479 * float(au)
    adjust = -0.5 * (7.7902731817 * float(au) + 41.7652462792)
    return '{}em'.format(adjust)


@register.filter
def scale_s_orbit(au):
    # adjust = 473.3048 * float(au)
    adjust = 77.902731817 * float(au) + 417.652462792
    return '{}em'.format(adjust)


@register.filter
def scale_s_orbit_half(au):
    # adjust = -236.6524 * float(au)
    adjust = -0.5 * (77.902731817 * float(au) + 417.652462792)
    return '{}em'.format(adjust)


# calculate semi-major axis from period and solar mass, adjust based on earth


@register.filter
def scale_stretch_orbit_calc(period, star_mass):
    # adjust = 56 * orbit_calc(period, star_mass)
    adjust = 5.952556919 * orbit_calc(period, star_mass) + 55.5253009955
    return '{}em'.format(adjust)

@register.filter
def scale_stretch_orbit_half_calc(period, star_mass):
    # adjust = -28 * orbit_calc(period, star_mass)
    adjust = -0.5 * (5.952556919 * orbit_calc(period, star_mass) + 55.5253009955)
    return '{}em'.format(adjust)


@register.filter
def scale_d_orbit_calc(period, star_mass):
    # adjust = 49.50959 * orbit_calc(period, star_mass)
    adjust = 7.7902731817 * orbit_calc(period, star_mass) + 41.7652462792
    return '{}em'.format(adjust)


@register.filter
def scale_d_orbit_half_calc(period, star_mass):
    # adjust = -24.75479 * orbit_calc(period, star_mass)
    adjust = -0.5 * (7.7902731817 * orbit_calc(period, star_mass) + 41.7652462792)
    return '{}em'.format(adjust)


@register.filter
def scale_s_orbit_calc(period, star_mass):
    # adjust = 473.3048 * orbit_calc(period, star_mass)
    adjust = 77.902731817 * orbit_calc(period, star_mass) + 417.652462792
    return '{}em'.format(adjust)


@register.filter
def scale_s_orbit_half_calc(period, star_mass):
    # adjust = -236.6524 * orbit_calc(period, star_mass)
    adjust = -0.5 * (77.902731817 * orbit_calc(period, star_mass) + 417.652462792)
    return '{}em'.format(adjust)


# calculate orbital speed from both semi-major axis and period


@register.filter
def orbit_speed(au, period):
    adjust = 2 * math.pi * float(au) * 149597871 / (float(period) * 24)
    return '{} km/h'.format(adjust)


# calculate circumference from planet radius


@register.filter
def circumference(radius):
    adjust = 2 * math.pi * float(radius) * 69911
    return '{} km'.format(adjust)


# calculate distance from star from AU


@register.filter
def distance(au):
    adjust = 149597871 * float(au)
    return '{} km'.format(adjust)


# calculate semi-major axis from period and solar mass


@register.filter
def distance_calc(period, star_mass):
    adjust = 149597871 * orbit_calc(period, star_mass)
    return '{} km'.format(adjust)


# get period based on earth


@register.filter
def time(period):
    # adjust = 12.00021 * float(period) / 365
    adjust = (float(period) * 0.32854354) - 0.0176144397
    return '{}s'.format(adjust)


# get period from semi-major axis and solar mass based on earth


@register.filter
def time_calc(au, star_mass):
    # adjust = 12.00021 * period_calc(au, star_mass)
    adjust = (period_calc(au, star_mass) * 0.32854354) - 0.0176144397
    return '{}s'.format(adjust)


@register.filter
def type(spectral):
    if spectral[0] == 'O':
        return 'rgb(0, 75, 255)'
    elif spectral[0] == 'B':
        return 'rgb(85, 120, 255)'
    elif spectral[0] == 'A':
        return 'rgb(125, 185, 255)'
    elif spectral[0] == 'F':
        return 'rgb(200, 220, 255)'
    elif spectral[0] == 'G':
        return 'rgb(255, 220, 200)'
    elif spectral[0] == 'K':
        return 'rgb(255, 220, 150)'
    elif spectral[0] == 'M':
        return 'rgb(255, 175, 100)'
    elif spectral[0] == 'L':
        return 'rgb(200, 50, 0)'
    elif spectral[0] == 'T':
        return 'rgb(100, 0, 75)'
    elif spectral[0] == 'Y':
        return 'rgb(50, 40, 65)'


@register.filter
def type_shadow(spectral):
    if spectral[0] == 'O':
        return 'rgba(0, 75, 255, 0.4)'
    elif spectral[0] == 'B':
        return 'rgba(85, 120, 255, 0.4)'
    elif spectral[0] == 'A':
        return 'rgba(145, 185, 255, 0.4)'
    elif spectral[0] == 'F':
        return 'rgba(200, 220, 255, 0.4)'
    elif spectral[0] == 'G':
        return 'rgba(255, 220, 200, 0.4)'
    elif spectral[0] == 'K':
        return 'rgba(255, 220, 150, 0.4)'
    elif spectral[0] == 'M':
        return 'rgba(255, 175, 100, 0.4)'
    elif spectral[0] == 'L':
        return 'rgba(200, 50, 0, 0.4)'
    elif spectral[0] == 'T':
        return 'rgba(100, 0, 75, 0.4)'
    elif spectral[0] == 'Y':
        return 'rgba(50, 40, 65, 0.4)'
