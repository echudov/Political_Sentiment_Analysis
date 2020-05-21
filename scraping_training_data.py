import pandas as pd
import numpy as np
from MyArticle import MyArticle
from newspaper import Article
from threading import Thread
import queue
import traceback
import time


class Worker(Thread):
    def __init__(self, tasks, timeout_seconds):
        Thread.__init__(self)
        self.tasks = tasks
        self.timeout = timeout_seconds
        self.daemon = True
        self.start()

    def run(self):
        while True:
            try:
                func, args, kwargs = self.tasks.get(timeout=self.timeout)
            except queue.Empty:
                break
            try:
                func()
            except Exception:
                traceback.print_exc()

            self.tasks.task_done()


class ThreadPool:
    def __init__(self, num_threads, timeout_seconds):
        self.tasks = queue.Queue(num_threads)
        for _ in range(num_threads):
            Worker(self.tasks, timeout_seconds)

    def add_task(self, func, *args, **kwargs):
        self.tasks.put((func, args, kwargs))

    def wait_completion(self):
        self.tasks.join()


def concurrently_parse(articles, threads=5, timeout_seconds=10):
    pool = ThreadPool(threads, timeout_seconds)
    for art in articles:
        pool.add_task(func=art.download_and_parse, args=None, kwargs=None)
    pool.wait_completion()


if __name__ == '__main__':
    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')

    # we will need to multithread this process, as it requires downloading data from multiple sources.
    # The parsing itself isn't the bottleneck, but rather the sources themselves,
    # so hopefully multithreading fixes that.
    t0 = time.time()
    arts = {link: MyArticle(str(link)) for link in pd.Series.tolist(df['External Article Link'])[:100]}
    concurrently_parse(arts.values())
    print(str(time.time() - t0) + ' seconds')
