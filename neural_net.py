import sklearn
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import os
import sys
import pickle
import time
import pandas as pd
import MyArticle
import numpy as np

ASSIGNMENTS = {'Left': 0, 'Lean Left': 1, 'Center': 2, 'Lean Right': 3, 'Right': 4}

class Net(nn.Module):

    def __init__(self, input_size):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(input_size, 1000)  # first fully connected layer
        self.fc2 = nn.Linear(1000, 5)  # second fully connected layer

    def forward(self, x):
        x = F.leaky_relu(self.fc1(x))
        logits = F.leaky_relu(self.fc2(x))
        return logits


def unique_topics_ids(arts, sorted=True):
    toreturn = set()
    for a in arts:
        for entity in a.nlp_info.entities:
            if entity.salience >= 0.01:
                toreturn.add(entity.name)
    toreturn = list(toreturn)
    if sorted:
        toreturn.sort()
    return {toreturn[i]: i for i in range(len(toreturn))}


def input_and_result(article, topic_ids, allsides_df,
                     device=torch.device("cuda" if torch.cuda.is_available() else "cpu")):
    input_tensor = torch.zeros(len(topic_ids.keys()), dtype=torch.float, device=device)
    for entity in article.nlp_info.entities:
        if entity.salience >= 0.01:
            ent = MyArticle.Entity(score=entity.sentiment.score, salience=entity.salience, magnitude=entity.sentiment.magnitude)
            index = topic_ids[entity.name]
            input_tensor[index] = ent.sentiment

    output_tensor = torch.zeros(5, dtype=torch.bool, device=device)
    allsides_rating = article.get_allsides_rating(allsides_df)
    output_class = ASSIGNMENTS[allsides_rating]
    return input_tensor, output_class


if __name__ == '__main__':
    # read through every file in articles
    articles = []
    t0 = time.time()
    directory = os.path.join(sys.path[0], 'articles/')
    for file in os.listdir(directory):
        with open(os.path.join(directory, file), 'rb') as f:
            article = pickle.load(f)
            articles.append(article)
    print('Time to unpickle articles: ' + str(time.time() - t0) + ' seconds')
    topics = unique_topics_ids(articles)
    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')
    # initializing basic properties of the net
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(input_and_result(articles[2], topics, df, device=device))
    lr = 0.001
    net = Net(len(topics.keys()))
    net.float()

    loss_function = nn.NLLLoss()
    optimizer = optim.SGD(net.parameters(), lr=lr)
    for epoch in range(10):
        index = 0
        for article in articles:
            index += 1
            print('article number: ' + str(index))
            # clear gradients before each instance of article
            net.zero_grad()

            # create training data for the article
            features, target = input_and_result(article, topics, df, device=device)
            classification = torch.from_numpy(np.array([target]))
            log_prob = F.log_softmax(net(features))
            print(classification.shape)
            loss = loss_function(log_prob, classification)
            loss.backward()
            optimizer.step()