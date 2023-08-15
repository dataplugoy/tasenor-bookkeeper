import os

def data_files_directory():
    """
    Return directory containing data files for testing.
    """
    return os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'data', 'files'))
