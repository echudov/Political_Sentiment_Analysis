import pandas as pd
import numpy as np
from MyArticle import MyArticle
from newspaper import Article

if __name__ == '__main__':
    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')

    # parsing each articles text and putting it into a dictionary
    # this might take a while lol
    articles = {link: Article(link) for link in df['External Article Link']}
    print(len(articles))