# import json
# from django.core import serializers
# from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, render_to_response

import csv
import urllib2


def home(request):
    return render(request, 'home.html')

def solar(request):
    return render(request, 'solar.html')

def solar_working(request):
    return render(request, 'working_solar.html')


def test(request):
    base = "http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=exoplanets"
    columns = "&columns=distinct%20pl_hostname,pl_pnum,rowupdate"
    # search = "&where=rowupdate%20like%20%272014%2010%25%27&order=rowupdate%20desc"
    start_date = "%272014%2004%2001%27"
    end_date = "%272015%2001%2001%27"
    search = "&where=rowupdate%20between{}and{}&order=rowupdate%20desc".format(start_date, end_date)
    url = base + columns + search
    response = urllib2.urlopen(url)

    reader = csv.reader(response, delimiter=',', quotechar='"')
    keys = next(reader) #skip the headers
    out = [{key: val for key, val in zip(keys, prop)} for prop in reader]
    data = {'systems': out}
    # test_json = json.dumps(out)

    return render_to_response('list.html', data)
    # return JsonResponse(test_json, safe=False)


def details(request, star):
    star_adjust = star.split(" ")
    star = "%20".join(star_adjust)
    base = "http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=exoplanets"
    columns = "&columns=distinct%20pl_hostname,pl_pnum,rowupdate,st_glon,st_glat,st_spstr,pl_name,pl_orbper,pl_orbsmax,pl_orbeccen,pl_massj,pl_msinij,pl_radj,st_mass,st_rad"
    search = "&where=pl_hostname%20like%20%27"+star+"%27"
    # print search
    url = base + columns + search
    # print url
    response = urllib2.urlopen(url)

    reader = csv.reader(response, delimiter=',', quotechar='"')
    keys = next(reader) #skip the headers
    out = [{key: val for key, val in zip(keys, prop)} for prop in reader]
    # print out
    data = {'systems': out}

    return render_to_response('details.html', data)
    # return JsonResponse(test_json, safe=False)




def system(request, star):
    star_adjust = star.split(" ")
    star = "%20".join(star_adjust)
    base = "http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=exoplanets"
    columns = "&columns=pl_hostname,pl_name,pl_orbper,pl_orbsmax,pl_orbeccen,pl_massj,pl_msinij,pl_radj,st_mass,st_rad,st_spstr"
    search = "&where=pl_hostname%20like%20%27"+star+"%27&order=pl_orbsmax"
    # print search
    url = base + columns + search
    # print url
    response = urllib2.urlopen(url)

    reader = csv.reader(response, delimiter=',', quotechar='"')
    keys = next(reader) #skip the headers
    out = [{key: val for key, val in zip(keys, prop)} for prop in reader]
    # print out
    data = {'systems': out}

    return render_to_response('solar.html', data)