include default.tcl;

int test()
{
	print("test");

	int testing = 69;
	int test[69] = { 1, 2, 3, 4, 5, 6, 779 };

	apin what = 3;
	dpin that = 4;

	write 69 to that;
	read that to testing;

	return 3;
}