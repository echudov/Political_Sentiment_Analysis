import queue
import time
import traceback
from threading import Thread

import pandas as pd
from google.cloud import language

from MyArticle import MyArticle


class Worker(Thread):
    def __init__(self, tasks: queue.Queue, timeout_seconds: float) -> None:
        Thread.__init__(self)
        self.tasks = tasks
        self.timeout = timeout_seconds
        self.daemon = True
        self.start()

    def run(self):
        while True:
            try:
                func, temp, arguments = self.tasks.get(timeout=self.timeout)
            except queue.Empty:
                break
            # noinspection PyBroadException
            try:
                if arguments['kwargs'] is None:
                    func()
                else:
                    func(client=arguments['kwargs']['client'])
            except Exception:
                traceback.print_exc()

            self.tasks.task_done()


class ThreadPool:
    def __init__(self, num_threads: int, timeout_seconds: float) -> None:
        self.tasks = queue.Queue(num_threads)
        for _ in range(num_threads):
            Worker(self.tasks, timeout_seconds)

    def add_task(self, func, *args, **kwargs):
        self.tasks.put((func, args, kwargs))

    def wait_completion(self):
        self.tasks.join()


def concurrently_parse(articles, threads=20, timeout_seconds=10):
    pool = ThreadPool(threads, timeout_seconds)
    for art in articles:
        pool.add_task(func=art.download_and_parse, args=None, kwargs=None)
    pool.wait_completion()


def concurrently_analyze(articles, threads=100, timeout_seconds=100, client=language.LanguageServiceClient()):
    pool = ThreadPool(threads, timeout_seconds)
    for art in articles:
        pool.add_task(func=art.convert_to_file, args=None, kwargs={'client': client})
    pool.wait_completion()


if __name__ == '__main__':
    filename: str = "data_export_headline_roundups_6-1-2012_12-14-2019.csv"
    df = pd.read_csv(filename, encoding='ISO-8859-1')

    print(df.columns)
    # we will need to multithread this process, as it requires downloading data from multiple sources.
    # The parsing itself isn't the bottleneck, but rather the sources themselves,
    # so hopefully multithreading fixes that.
    '''
    t0 = time.time()
    links = pd.Series.tolist(df['External Article Link'])
    arts = [MyArticle(str(links[i]), allsides_index=i) for i in range(len(links))]
    print(len(arts))
    concurrently_analyze(arts)
    print(str(time.time() - t0) + ' seconds')
    '''
