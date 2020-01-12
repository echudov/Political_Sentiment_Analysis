from newspaper import Article


class  MyArticle:

    def __init__(self, url):
        self.url = url
        self.article = Article(url)
        self.article.download()
        self.article.parse()
        print(self.article.title)
        print(self.article.authors)
        print(self.article.text)

    def get_baseline(self):
        # parse from allsides
        # hold data in local file or something
        # need to get author and original source baseline
        print('temp')

    def political_nature(self):
        # determine 2 things:
        # 1: Is this political in the first place
        # 2: Determine how parties/individuals feel about it
        # 2b: possibly try to use some data on how republicans and democrats actually feel
        #     on the issue (i.e. 55% of democrats agreeing = 0.55 modifier rather than 1 or -1)
        print('temp')

    def analyze_sentiment(self):
        print("temp")

if __name__ == '__main__':
    art = MyArticle('https://www.politico.com/news/2020/01/09/tom-steyer-qualifies-democratic-debate-096915')