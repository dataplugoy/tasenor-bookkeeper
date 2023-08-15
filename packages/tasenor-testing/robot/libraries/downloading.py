from datetime import datetime
import re
import sys
import os
import tarfile
import pathlib

DEBUG = False

def get_test_root_directory() -> str:
    """
    Get the root of the testing directory.
    """
    return os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))

def get_download_directory() -> str:
    """
    Construct and return Downloads directory for the current HOME.
    """
    home = os.environ['HOME']
    if not home:
        raise Exception('HOME environment is not set.')
    downloads = os.path.realpath(os.path.join(home, 'Downloads'))
    if not os.path.exists(downloads):
        os.mkdir(downloads)
    return downloads

def get_work_directory() -> str:
    """
    Return full path to the work directory.
    """
    root = get_test_root_directory()
    return os.path.join(root, 'workdir')

def compare_files(full_path, data_path):
    """
    Compare files line by line. The sample file is from data directory.
    """
    root = get_test_root_directory()
    lines1 = open(full_path, 'r').read().split('\n')
    full_path2 = os.path.join(root, data_path)
    lines2 = open(full_path2, 'r').read().split('\n')
    if DEBUG:
        sys.stderr.write('\n')
        sys.stderr.write('=============== %r ===============\n' % full_path)
        sys.stderr.write('                %r\n' % full_path2)
        sys.stderr.write('\n')
    for i in range(min(len(lines1), len(lines2))):
        if DEBUG:
            sys.stderr.write('Line %r:\n' % (i+1))
            sys.stderr.write('  %r\n' % lines1[i])
            sys.stderr.write('  %r\n' % lines2[i])
        if lines1[i] != lines2[i]:
            raise Exception('Line %r in file %r differs:\n%r\n%r\n' % (i+1, full_path, lines1[i], lines2[i]))
    if len(lines1) != len(lines2):
        raise Exception('Files %r and %r have different number of lines: %r vs %r.' % (full_path, data_path, len(lines1), len(lines2)))

def fix_downloaded_test_file(file_path):
    """
    Unify certain things in the test result file to make comparison easier.
    """
    if file_path[-5:] == '.json':
        file_path = pathlib.Path(file_path)
        content = re.sub('"schemeVersion": "[0-9.]+"','"schemeVersion": "1.2.3"', file_path.read_text())
        content = re.sub('"databaseId": [0-9]+','"databaseId": 9', content)
        file_path.write_text(content)

def compare_directories(dir_path, dir_path2):
    """
    Scan directories and raise error if differencies found.
    """
    for rootdir, dirs, files in os.walk(dir_path):
        for name in files:
            full_path = os.path.join(rootdir, name)
            relative_path = full_path.replace(dir_path + '/', "")
            full_path2 = os.path.join(dir_path2, relative_path)
            if pathlib.Path(full_path).exists() and not pathlib.Path(full_path2).exists():
                raise Exception('File %r exists but file %r does not exist' % (full_path, full_path2))

    for rootdir, dirs, files in os.walk(dir_path2):
        for name in files:
            full_path = os.path.join(rootdir, name)
            relative_path = full_path.replace(dir_path2 + '/', "")
            full_path2 = os.path.join(dir_path, relative_path)
            if pathlib.Path(full_path).exists() and not pathlib.Path(full_path2).exists():
                raise Exception('File %r exists but file %r does not exist' % (full_path, full_path2))
            fix_downloaded_test_file(full_path)
            fix_downloaded_test_file(full_path2)
            compare_files(full_path, f"workdir/tested/{relative_path}")

def compare_tar_packages(full_path, data_path):
    """
    Compare content of tar packages file by file.
    """
    tested = tarfile.open(full_path, 'r')
    path1 = pathlib.Path(get_work_directory()) / 'tested'
    path1.mkdir(parents=True)
    tested.extractall(path1)

    root = get_test_root_directory()
    original = tarfile.open(pathlib.Path(root) / data_path, 'r')
    path2 = pathlib.Path(get_work_directory()) / 'original'
    path2.mkdir(parents=True)
    original.extractall(path2)

    compare_directories(str(path1), str(path2))

def remove_work_files():
    """
    Go through work directory and remove all files.
    """
    work = get_work_directory()

    for rootdir, dirs, files in os.walk(work, topdown=False):
        for name in files:
            full_path = os.path.join(rootdir, name)
            if name != '.gitkeep':
                pathlib.Path(full_path).unlink()
        for name in dirs:
            full_path = os.path.join(rootdir, name)
            pathlib.Path(full_path).rmdir()
