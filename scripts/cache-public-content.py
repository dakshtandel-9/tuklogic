"""Take a one-time snapshot for local article search and career listings."""
import concurrent.futures
import importlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

importlib.import_module('localize-assets')  # Reuse the verified certificate setup.
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'reference/api/offline-content.json'


def fetch(name, function, data=None):
    query = urllib.parse.urlencode({'payload': json.dumps({'data': data, 'context': {}}), 'createServerFn': ''})
    url = 'https://uxbert.com/_serverFn/src_server-functions_' + function + '_createServerFn_handler?' + query
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'x-tsr-redirect': 'manual'})
    with urllib.request.urlopen(request, timeout=60) as response:
        value = json.load(response)
    if 'result' not in value:
        raise ValueError(f'{name}: upstream did not return content')
    return name, value['result']


if __name__ == '__main__':
    tasks = [
        ('en', 'posts_ts--fetchPosts', {'query': {'per_page': 100, 'page': 1}, 'locale': 'en'}),
        ('ar', 'posts_ts--fetchPosts', {'query': {'per_page': 100, 'page': 1}, 'locale': 'ar'}),
        ('categories', 'posts_ts--fetchAllCategories', None),
        ('tags', 'posts_ts--fetchAllTags', None),
        ('careers', 'getCareersData_ts--getCareersData', None),
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        result = dict(pool.map(lambda task: fetch(*task), tasks))
    for locale in ('en', 'ar'):
        pages = int(result[locale]['headers']['totalPages'])
        for page in range(2, pages + 1):
            _, more = fetch(locale, 'posts_ts--fetchPosts', {'query': {'per_page': 100, 'page': page}, 'locale': locale})
            result[locale]['data'].extend(more['data'])
    TARGET.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
    print('Cached articles, categories, tags, and careers in', TARGET)
