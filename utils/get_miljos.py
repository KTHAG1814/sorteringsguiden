import json
import re
from html.parser import HTMLParser

name = re.compile('href.*>(.*)</a>')
onetag = re.compile('>(.*)<')
lonlat = re.compile('title="(.*)">')

TYPES = ['Aerosolspray', 'Bekämpningsmedel', 'Bilbatterier', 'Diverse kemikalier', 'Fotokemikalier', 'Färg/Lack', 'Gasol', 'Kvicksilver', 'Ljuskällor', 'Lösningsmedel', 'Matolja', 'Rengöringsmedel', 'Småbatterier', 'Spillolja']
TYPES_UP = [x.upper() for x in TYPES]

h = HTMLParser()
list = []
with open("data/miljos.html", "r") as file:
    for row in file:
        if "Serviceenhetsdetaljer" in row:
            obj = {}
            m = name.search(row)
            station_name = h.unescape(m.group(1))
            obj['Name'] = station_name
            for row in file:
                if "street-address" in row:
                    m = onetag.search(row)
                    address = h.unescape(m.group(1))
                    obj['Address'] = address
                if "locality" in row:
                    m = onetag.search(row)
                    locality = h.unescape(m.group(1))
                    obj['City'] = locality
                if "latitude" in row:
                    m = lonlat.search(row)
                    latitude = m.group(1)
                    obj['Lat'] = latitude
                if "longitude" in row:
                    m = lonlat.search(row)
                    longitude = m.group(1)
                    obj['Lng'] = longitude
                if "</li>" in row:
                    break
            obj['Kind'] = 'Miljöstation'
            obj['Types'] = TYPES
            obj['Types_Up'] = TYPES_UP
            list.append(obj)

print(json.dumps(list, ensure_ascii=False))
