"""Refresh publicly advertised rental listings. Respect robots.txt and use light requests."""
import datetime,json,re,time,urllib.parse,urllib.robotparser,xml.etree.ElementTree as ET
from pathlib import Path
import requests
from bs4 import BeautifulSoup
ROOT='https://www.landestate.co.uk'
UA='NadsRentalExplorer/1.0 (public listing metadata; respectful daily check)'
s=requests.Session();s.headers.update({'User-Agent':UA})
robots=urllib.robotparser.RobotFileParser();robots.set_url(ROOT+'/robots.txt')
try: robots.read()
except Exception as e: raise SystemExit('Could not check robots.txt: '+str(e))
def get(url):
 if not url.startswith(ROOT+'/') or not robots.can_fetch(UA,url):raise ValueError('Robots policy does not permit '+url)
 r=s.get(url,timeout=18);r.raise_for_status();time.sleep(1);return r.text
seen=set();urls=[]
def sitemap(url,depth=0):
 if depth>3 or url in seen:return
 seen.add(url)
 try: raw=get(url);root=ET.fromstring(raw)
 except Exception as e:print('Sitemap unavailable',url,e);return
 for e in root.iter():
  if e.tag.endswith('loc') and e.text:
   u=e.text.strip()
   if u.endswith('.xml') and u.startswith(ROOT):sitemap(u,depth+1)
   elif '/property-to-rent/' in u and u.startswith(ROOT):urls.append(u)
sitemap(ROOT+'/sitemap_index.xml');sitemap(ROOT+'/wp-sitemap.xml')

print('DIAGNOSTIC: Sitemap property URLs found:', len(urls), flush=True)
print('DIAGNOSTIC: First five URLs:', urls[:5], flush=True)
test_url = ROOT + '/properties/?availability=9&department=residential-lettings'
try:
    test_html = get(test_url)
    test_soup = BeautifulSoup(test_html, 'html.parser')
    test_links = [
        a.get('href') for a in test_soup.find_all('a', href=True)
        if '/property-to-rent/' in a.get('href', '')
    ]
    print('DIAGNOSTIC: Search page accessible: YES', flush=True)
    print('DIAGNOSTIC: Property links found:', len(test_links), flush=True)
    print('DIAGNOSTIC: Sample links:', test_links[:5], flush=True)

unique_links = sorted(set(
    urllib.parse.urljoin(ROOT, link)
    for link in test_links if link
))
print('DIAGNOSTIC: Unique property links:', len(unique_links), flush=True)
pagination = [
    a.get('href') for a in test_soup.find_all('a', href=True)
    if 'page/' in a.get('href', '') or 'paged=' in a.get('href', '')
]
print('DIAGNOSTIC: Pagination links:', sorted(set(pagination))[:10], flush=True)
except Exception as e:
    print('DIAGNOSTIC: Search page failed:', repr(e), flush=True)
# Do not infer current inventory from old indexed property pages.
if not urls:raise SystemExit('No rental listing URLs discovered; preserving previous snapshot.')
properties=[]
for u in dict.fromkeys(urls):
 try:
  soup=BeautifulSoup(get(u),'html.parser')
  text=soup.get_text(' ',strip=True)
  if not re.search(r'\bTo Let\b',text,re.I) or re.search(r'\bLet Agreed\b|\bLet By\b',text[:900],re.I):continue
  h=soup.find('h1');title=h.get_text(' ',strip=True) if h else ''
  if not title:continue
  m=re.search(r'£[\d,]+\s*(?:pcm|pw|per month)',text,re.I)
  price=m.group(0) if m else ''
  location=title.replace(',',', ')
  properties.append({'title':title,'price':price,'url':u,'location':location+', Kent, UK'})
 except Exception as e:print('Skipped',u,e)
if not properties:raise SystemExit('No confirmed To Let properties; preserving previous snapshot.')
output={'updated':datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'notice':'Public listings; verify status with Land Estates','properties':properties}
Path('rentals.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('Wrote',len(properties),'rental listings')
