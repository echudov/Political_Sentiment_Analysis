import MyArticle

from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types
def analyze(article):
    client = language.LanguageServiceClient()

    with open(filename, 'r') as articleFile:
        content = articleFile.read()

    document = types.Document(content=content, type=enums.Document.Type.PLAIN_TEXT)
    annotations = client.analyze_sentiment(document=document)