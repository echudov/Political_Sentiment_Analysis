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
import random

ASSIGNMENTS = {'Left': 0, 'Lean Left': 1, 'Center': 2, 'Lean Right': 3, 'Right': 4}


class Net(nn.Module):

    def __init__(self, input_size):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(input_size, input_size)  # first fully connected layer
        self.fc2 = nn.Linear(input_size, 3000)  # second fully connected layer
        self.fc3 = nn.Linear(3000, len(ASSIGNMENTS))  # Final layer before softmax

    def forward(self, x):
        x = F.leaky_relu(self.fc1(x))
        x = self.fc2(x)
        x = self.fc3(x)
        return F.log_softmax(x)


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
            ent = MyArticle.Entity(score=entity.sentiment.score, salience=entity.salience,
                                   magnitude=entity.sentiment.magnitude)
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

    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')

    directory = os.path.join(sys.path[0], 'articles/')
    for file in os.listdir(directory):
        with open(os.path.join(directory, file), 'rb') as f:
            article = pickle.load(f)
            if article.get_allsides_rating(df) in ASSIGNMENTS.keys():
                articles.append(article)

    print('Time to unpickle articles: ' + str(time.time() - t0) + ' seconds')
    topics = unique_topics_ids(articles)

    # initializing basic properties of the net
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(device)
    lr = 0.002

    net = Net(len(topics.keys()))
    net.float()

    loss_function = nn.NLLLoss()
    optimizer = optim.SGD(net.parameters(), lr=lr, momentum=0.5)
    for epoch in range(10):
        index = 0
        shuffled_articles = articles
        random.shuffle(shuffled_articles)
        print(len(articles))
        batch_size = 10
        training_size = 9000
        for batch_num in range(int(training_size / batch_size)):

            # clear gradients before each instance of article
            optimizer.zero_grad()

            # create training data for the article
            feature_batch = []
            target_batch = []
            for elem in range(batch_size):
                article = articles[batch_num * batch_size + elem]
                features, target = input_and_result(article, topics, df, device=device)
                feature_batch.append(features)
                target_batch.append(torch.from_numpy(np.array([target])))
                index += 1
            feature_batch = torch.stack(feature_batch, dim=0)
            target_batch = torch.cat(target_batch, dim=0)
            out = net(feature_batch)

            loss = loss_function(out, target_batch)
            loss.backward()
            print('Batch: ' + str(batch_num) + ' Loss: ' + str(loss))
            optimizer.step()
