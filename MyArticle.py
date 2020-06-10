from newspaper import Article
import time
from google.cloud import language
from google.cloud import language_v1
from google.cloud.language_v1 import enums
import os
import pickle
import sys
import math
import pandas as pd

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "/home/elia/Downloads/Political Sentiment Analyzer-aacb37a3999c.json"


class Entity:

    def __init__(self, score, magnitude, salience):
        self.score = score
        self.magnitude = magnitude
        self.salience = salience
        self.sentiment = self.compute_adjusted_sentiment()

    def compute_adjusted_sentiment(self):
        if self.score >= 0:
            return self.salience * ((abs(self.score)) ** (1.0 / (self.magnitude + 0.01)))
        else:
            return 0.0 - self.salience * ((abs(self.score)) ** (1.0 / (self.magnitude + 0.01)))


class MyArticle:
    DOCUMENT_TYPE = enums.Document.Type.PLAIN_TEXT
    LANG = 'en'
    ENCODING_TYPE = enums.EncodingType.UTF8

    def __init__(self, url, allsides_index):
        self.url = url
        self.allsides_index = allsides_index
        self.article = Article(url)
        self.parsed = False
        self.download_time = None
        self.parse_time = None
        self.text = None
        self.title = None
        self.authors = None
        self.nlp_info = None

    def download_and_parse(self):
        if self.parsed:
            return
        t0 = time.time()
        self.article.download()
        self.download_time = time.time() - t0
        print('download_time: ' + str(self.download_time))
        t0 = time.time()
        self.article.parse()
        self.parse_time = time.time() - t0
        print('parse_time: ' + str(self.parse_time))
        self.text = self.article.text
        self.title = self.article.title
        self.authors = self.article.authors
        self.parsed = True

    def convert_to_file(self, client=language.LanguageServiceClient()):
        self.download_and_parse()
        self.analyze_sentiment(client=client)
        with open(os.path.join(sys.path[0], 'articles/' + self.title + '.txt'), 'wb') as file:
            pickle.dump(self, file)

    def get_baseline(self):
        # parse from allsides
        # hold data in local file or something
        # need to get author and original source baseline
        print('temp')

    def get_allsides_rating(self, allsides_df):
        row = allsides_df.loc[allsides_df['External Article Link'] == self.url]
        return row['News Source Bias'].values[0]

    def read_through_nlp(self, mentions=False):
        if self.nlp_info is None:
            return
        for entity in self.nlp_info.entities:
            print(u"Representative name for the entity: {}".format(entity.name))
            # Get entity type, e.g. PERSON, LOCATION, ADDRESS, NUMBER, et al
            print(u"Entity type: {}".format(enums.Entity.Type(entity.type).name))
            # Get the salience score associated with the entity in the [0, 1.0] range
            print(u"Salience score: {}".format(entity.salience))
            # Get the aggregate sentiment expressed for this entity in the provided document.
            sentiment = entity.sentiment
            print(u"Entity sentiment score: {}".format(sentiment.score))
            print(u"Entity sentiment magnitude: {}".format(sentiment.magnitude))
            if mentions:
                # Loop over the metadata associated with entity. For many known entities,
                # the metadata is a Wikipedia URL (wikipedia_url) and Knowledge Graph MID (mid).
                # Some entity types may have additional metadata, e.g. ADDRESS entities
                # may have metadata for the address street_name, postal_code, et al.
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

    def analyze_sentiment(self, client=language.LanguageServiceClient()):
        if not self.parsed:
            self.download_and_parse()

        print('parsing')
        document = {"content": self.text, "type": self.__class__.DOCUMENT_TYPE, "language": self.__class__.LANG}
        response = client.analyze_entity_sentiment(document, encoding_type=self.__class__.ENCODING_TYPE)
        self.nlp_info = response


if __name__ == '__main__':
    print(os.path)
    art = MyArticle(
        'https://www.reuters.com/article/us-usa-trump-impeachment/white-house-official-criticizes-trump-call-decries-cowardly-attacks-idUSKBN1XT1DQ',
        0)
    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')
    print(df['News Source Bias'].unique())
    print(art.get_allsides_rating(df))
