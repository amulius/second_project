import json
from django.http import JsonResponse
from django.shortcuts import render, render_to_response
import csv
import urllib2
from django.views.decorators.csrf import csrf_exempt
import requests

exo_url = "http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI"
exo_data = {
    'table': 'exoplanets',
    'columns':'pl_hostname,pl_name,pl_orbper,pl_orbsmax,pl_orbeccen,pl_orbincl,pl_massj,pl_msinij,pl_radj,pl_orbtper,pl_orblper,st_mass,st_rad,st_spstr',
}


def home(request):
    return render(request, 'home.html')


def solar(request):
    return render(request, 'solar.html')


def orbit(request, star):
    return render(request, 'orbit.html')


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
    keys = next(reader)  # skip the headers
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


@csrf_exempt
def api(request):
    if request.method == 'GET':
        # data_in = json.loads(request.body)
        data_in = request.GET
        if data_in['want'] == 'exoplanets':
            star = data_in['which']
            exo_data['columns'] = 'pl_hostname,pl_name,pl_orbper,pl_orbsmax,pl_orbeccen,pl_orbincl,pl_massj,pl_msinij,pl_radj,pl_orbtper,pl_orblper,st_mass,st_rad,st_spstr',
            search = "&where=pl_hostname%20like%20%27"+star+"%27&order=pl_orbsmax"
            # print search
            if star != 'all':
                exo_data['where'] = "pl_hostname like '{}'".format(star)
                exo_data['order'] = 'pl_orbsmax'
            # print url
            r = requests.get(exo_url, params=exo_data)
            # print len(r.text)
            # response = urllib2.urlopen(url)
            # print response
            # reader = csv.reader(response, delimiter=',', quotechar='"')
            reader2 = csv.DictReader(r.text.splitlines(), delimiter=',')
            # for row in reader2:
            #     print row
            # print reader
            # keys = next(reader) #skip the headers
            # print keys
            # out = [{key: val for key, val in zip(keys, prop)} for prop in reader]
            out2 = [prop for prop in reader2]
            # print out2
            # print out
            # data = {'systems': out}
            data = {'systems': out2}
            return JsonResponse(data)
