from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    # Examples:
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),

    url(r'^$', 'exo_planet.views.home', name='home'),
    url(r'^test/$', 'exo_planet.views.test', name='test'),
    url(r'^details/(?P<star>.+)/$', 'exo_planet.views.details', name='details'),
    url(r'^system/(?P<star>.+)/$', 'exo_planet.views.system', name='system'),
    url(r'^solar/$', 'exo_planet.views.solar', name='solar'),
    url(r'^solar_working/$', 'exo_planet.views.solar_working', name='solar_working'),

    url(r'^asteroid/$', 'exo_planet.views.asteroid', name='asteroid'),
    url(r'^asteroid_json/$', 'exo_planet.views.asteroid_json', name='asteroid_json'),
)
