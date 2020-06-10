import pickle
import os

from MyArticle import MyArticle

from google.cloud import language
from google.cloud import language_v1
from google.cloud.language_v1 import enums

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "/home/elia/Downloads/Political Sentiment Analyzer-aacb37a3999c.json"

def analyze(art):
    client = language.LanguageServiceClient()

    text_content = art.text

    type_ = enums.Document.Type.PLAIN_TEXT

    lang = "en"
    document = {"content": text_content, "type": type_, "language": lang}
    encoding_type = enums.EncodingType.UTF8

    response = client.analyze_entity_sentiment(document, encoding_type=encoding_type)
    for entity in response.entities:
        print(u"Representative name for the entity: {}".format(entity.name))
        # Get entity type, e.g. PERSON, LOCATION, ADDRESS, NUMBER, et al
        print(u"Entity type: {}".format(enums.Entity.Type(entity.type).name))
        # Get the salience score associated with the entity in the [0, 1.0] range
        print(u"Salience score: {}".format(entity.salience))
        # Get the aggregate sentiment expressed for this entity in the provided document.
        sentiment = entity.sentiment
        print(u"Entity sentiment score: {}".format(sentiment.score))
        print(u"Entity sentiment magnitude: {}".format(sentiment.magnitude))
        # Loop over the metadata associated with entity. For many known entities,
        # the metadata is a Wikipedia URL (wikipedia_url) and Knowledge Graph MID (mid).
        # Some entity types may have additional metadata, e.g. ADDRESS entities
        # may have metadata for the address street_name, postal_code, et al.
        '''
        for metadata_name, metadata_value in entity.metadata.items():
            print(u"{} = {}".format(metadata_name, metadata_value))

        # Loop over the mentions of this entity in the input document.
        # The API currently supports proper noun mentions.
        
        for mention in entity.mentions:
            print(u"Mention text: {}".format(mention.text.content))
            # Get the mention type, e.g. PROPER for proper noun
            print(
                u"Mention type: {}".format(enums.EntityMention.Type(mention.type).name)
            )
        '''
    with open("sources.pkl", "rb") as file:
        sources = pickle.load(file)


if __name__ == '__main__':
    article = MyArticle('https://www.reuters.com/article/us-usa-trump-impeachment/white-house-official-criticizes-trump-call-decries-cowardly-attacks-idUSKBN1XT1DQ',
              allsides_index=123045985)
    article.download_and_parse()
    analyze(article)
