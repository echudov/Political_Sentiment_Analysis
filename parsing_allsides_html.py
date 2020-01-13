import resource
import sys

from bs4 import BeautifulSoup
import pickle

# for some reason pickle runs into recursion issues when the object
# (in this case the sources dictionary) is too large
# to solve this I just increased the system's max stack and recursion limit
# sourced from stackoverflow since I'm still not 100% on how this works lol
max_rec = 0x100000
resource.setrlimit(resource.RLIMIT_STACK, [0x100 * max_rec, resource.RLIM_INFINITY])
sys.setrecursionlimit(max_rec)

with open("Media Bias Ratings AllSides.html", "r") as file:
    soup = BeautifulSoup(file)
    main_body = soup.find('tbody')
    rows = main_body.find_all('tr')
    sources = {}
    for row in rows:
        elements = row.find_all('td')
        source = {}
        # pull bias
        bias_link = elements[1].a['href']
        media_bias = "https://www.allsides.com/media-bias/"
        if bias_link.startswith(media_bias):
            source['bias'] = bias_link[len(media_bias):]
        # community feedback
        feedback = elements[3].find_all('span')
        source['agree'] = feedback[0].string
        source['disagree'] = feedback[1].string
        # adding to sources
        name = elements[0].a.string
        sources[name] = source

with open("sources.pkl", "wb") as file:
    pickle.dump(sources, file)