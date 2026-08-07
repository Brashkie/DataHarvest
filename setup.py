from setuptools import setup, Extension
from Cython.Build import cythonize
import numpy as np

extensions = [
    Extension(
        "app.utils.parser_core",
        ["app/utils/parser_core.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=["/O2"] if __import__('sys').platform == 'win32' else ["-O3", "-ffast-math"],
    ),
    Extension(
        "app.analytics.analytics_core",
        ["app/analytics/analytics_core.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=["/O2"] if __import__('sys').platform == 'win32' else ["-O3", "-ffast-math"],
    ),
    Extension(
        "app.scrapers.scraper_core",
        ["app/scrapers/scraper_core.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=["/O2"] if __import__('sys').platform == 'win32' else ["-O3", "-ffast-math"],
    ),
]

setup(
    name="dataharvest-backend",
    ext_modules=cythonize(
        extensions,
        compiler_directives={
            "language_level": "3",
            "boundscheck": False,
            "wraparound": False,
            "nonecheck": False,
            "cdivision": True,
            "initializedcheck": False,
        },
        annotate=True,
    ),
)