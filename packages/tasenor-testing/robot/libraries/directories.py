import os

def data_files_directory():
    """
    Return directory containing data files for testing.
    """
    return os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'data', 'files'))


def qa_file(test, name):
    """
    Locate a file in QA repo.
    """
    return os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', '..', '..', '..', 'tests', test, 'data', 'files', name))
