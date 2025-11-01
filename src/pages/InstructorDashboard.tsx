import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SignupModal from '../components/SignupModal';
import LoginModal from '../components/LoginModal';
import CourseEditor from '../components/CourseEditor';
import { useAuth } from '../contexts/AuthContext';
import * as courseApi from '../api/courseApi';

type Lesson = { lessonId?: string; title: string; order?: number; contents?: { type?: 'text' | 'video' | 'file'; text?: string; url?: string; filename?: string; mimeType?: string; size?: number }[] };
type Module = { moduleId?: string; title: string; order?: number; lessons: Lesson[] };
type Course = { _id?: string; title: string; description: string; accessTier: string; status: string; tags?: string[]; modules?: Module[] };

export default function InstructorDashboard() {
	const [showSignup, setShowSignup] = useState(false);
	const [showLogin, setShowLogin] = useState(false);

	const { appUser, updateProfile } = useAuth();

	const [active, setActive] = useState<'profile' | 'instructor' | 'courses'>('profile');

	// Profile settings state
	const [username, setUsername] = useState('');
	const [bio, setBio] = useState('');
	const [picUrl, setPicUrl] = useState('');
	const [instruments, setInstruments] = useState<string[]>([]);
	const [interests, setInterests] = useState<string[]>([]);
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileMsg, setProfileMsg] = useState<string | null>(null);

	// Instructor info state
	const [headline, setHeadline] = useState('');
	const [credentials, setCredentials] = useState('');
	const [website, setWebsite] = useState('');
	const [instrSaving, setInstrSaving] = useState(false);
	const [instrMsg, setInstrMsg] = useState<string | null>(null);

	// Courses state
	const [courses, setCourses] = useState<Course[]>([]);
	const [loadingCourses, setLoadingCourses] = useState(false);
	const [editing, setEditing] = useState<Course | null>(null);
	const [savingCourse, setSavingCourse] = useState(false);

	useEffect(() => {
		if (!appUser) return;
		// profile
		setUsername(appUser.username || '');
		setBio(appUser.profile?.bio || '');
		setPicUrl(appUser.profile?.picUrl || '');
		setInstruments(appUser.profile?.instruments || []);
		setInterests(appUser.profile?.interests || []);

		// instructor
		setHeadline(appUser.instructorProfile?.headline || '');
		setCredentials(appUser.instructorProfile?.credentials || '');
		setWebsite(appUser.instructorProfile?.website || '');
	}, [appUser]);

	// profile handlers
	const toggle = (val: string, setFn: (s: string[]) => void, arr: string[]) => {
		setFn(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
	};

	const saveProfile = async () => {
		setProfileMsg(null);
		setProfileLoading(true);
		try {
			const updates = {
				username: username || '',
				profile: { bio: bio || '', picUrl: picUrl || '', instruments: instruments || [], interests: interests || [] }
			};
			if (!updateProfile) throw new Error('updateProfile not available');
			await updateProfile(updates);
			setProfileMsg('Profile saved');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setProfileMsg(msg || 'Failed to save');
		} finally {
			setProfileLoading(false);
			setTimeout(() => setProfileMsg(null), 2000);
		}
	};

	// instructor handlers
	const saveInstructor = async () => {
		setInstrMsg(null);
		setInstrSaving(true);
		try {
			if (!updateProfile) throw new Error('updateProfile unavailable');
			await updateProfile({ instructorProfile: { headline: headline || '', credentials: credentials || '', website: website || '' } });
			setInstrMsg('Saved');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setInstrMsg(msg || 'Save failed');
		} finally {
			setInstrSaving(false);
			setTimeout(() => setInstrMsg(null), 2500);
		}
	};

	// courses handlers
	const fetchCourses = async () => {
		setLoadingCourses(true);
		try {
			const data = await courseApi.listCourses({ mine: true });
			setCourses(data || []);
		} catch (err) {
			console.error('Failed to list courses', err);
			setCourses([]);
		} finally {
			setLoadingCourses(false);
		}
	};

	useEffect(() => {
		if (appUser && appUser.role === 'instructor') fetchCourses();
	}, [appUser]);

	const startNew = () => setEditing({ title: '', description: '', accessTier: 'free', status: 'draft', tags: [], modules: [] });

	const saveCourse = async (course: Course) => {
		setSavingCourse(true);
		try {
			if (course._id) {
				const updated = await courseApi.updateCourse(course._id, course);
				setCourses(prev => prev.map(c => (c._id === updated._id ? updated : c)));
				setEditing(null);
			} else {
				const created = await courseApi.createCourse(course);
				setCourses(prev => [created, ...prev]);
				setEditing(null);
			}
		} catch (err: any) {
			console.error('Save failed', err);
			const msg = err?.response?.data?.error || err?.message || String(err);
			alert('Save failed: ' + msg);
		} finally {
			setSavingCourse(false);
		}
	};

	const removeCourse = async (id?: string) => {
		if (!id) return;
		if (!confirm('Delete this course?')) return;
		try {
			await courseApi.deleteCourse(id);
			setCourses(prev => prev.filter(c => c._id !== id));
		} catch (err) {
			console.error('Delete failed', err);
			alert('Delete failed');
		}
	};

	const togglePublish = async (c: Course) => {
		if (!c._id) return;
		const newStatus = c.status === 'published' ? 'draft' : 'published';
		try {
			const updated = await courseApi.updateCourse(c._id, { status: newStatus });
			setCourses(prev => prev.map(p => (p._id === updated._id ? updated : p)));
		} catch (err) {
			console.error('Publish toggle failed', err);
			alert('Failed to change publish status');
		}
	};

	// helper small lists
	const INTEREST_OPTIONS = ['Guitar','Piano','Vocals','Music Theory','Production','Drums','Violin','Bass'];
	const INSTRUMENT_OPTIONS = ['Guitar','Piano','Violin','Drums','Bass','Saxophone','Trumpet','Cello'];

	if (!appUser) {
		return (
			<div className="min-h-screen">
				<Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
				{showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
				{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
				<main className="pt-20 p-8">
					<div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">Please log in to access instructor dashboard.</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (appUser.role !== 'instructor') {
		return (
			<div className="min-h-screen">
				<Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
				{showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
				{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
				<main className="pt-20 p-8">
					<div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">Your account is not an instructor account.</div>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
			{showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
			{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

			<main className="pt-20 p-6">
				<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
					{/* Sidebar */}
					<aside className="md:col-span-1 bg-white p-4 rounded shadow">
						<h2 className="text-lg font-semibold mb-4">Instructor</h2>
						<nav className="space-y-2">
							<button onClick={() => setActive('profile')} className={`w-full text-left px-3 py-2 rounded ${active === 'profile' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}>Profile</button>
							<button onClick={() => setActive('instructor')} className={`w-full text-left px-3 py-2 rounded ${active === 'instructor' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}>Instructor Info</button>
							<button onClick={() => setActive('courses')} className={`w-full text-left px-3 py-2 rounded ${active === 'courses' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}>Courses</button>
						</nav>
					</aside>

					{/* Content area */}
					<section className="md:col-span-3">
						<div className="bg-white p-6 rounded shadow">
							{active === 'profile' && (
								<div>
									<h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
									<div className="space-y-4">
										<div>
											<label className="block text-sm font-medium">Username</label>
											<input className="mt-1 block w-full rounded border p-2" value={username} onChange={e => setUsername(e.target.value)} />
										</div>

										<div>
											<label className="block text-sm font-medium">Bio</label>
											<textarea className="mt-1 block w-full rounded border p-2" rows={4} value={bio} onChange={e => setBio(e.target.value)} />
										</div>

										<div>
											<label className="block text-sm font-medium">Profile picture URL</label>
											<input className="mt-1 block w-full rounded border p-2" value={picUrl} onChange={e => setPicUrl(e.target.value)} />
										</div>

										<div>
											<label className="block text-sm font-medium">Instruments</label>
											<div className="mt-2 grid grid-cols-2 gap-2">
												{INSTRUMENT_OPTIONS.map(opt => (
													<label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer">
														<input type="checkbox" checked={instruments.includes(opt)} onChange={() => toggle(opt, setInstruments, instruments)} className="h-4 w-4" />
														<span className="text-sm">{opt}</span>
													</label>
												))}
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium">Interests</label>
											<div className="mt-2 grid grid-cols-2 gap-2">
												{INTEREST_OPTIONS.map(opt => (
													<label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer">
														<input type="checkbox" checked={interests.includes(opt)} onChange={() => toggle(opt, setInterests, interests)} className="h-4 w-4" />
														<span className="text-sm">{opt}</span>
													</label>
												))}
											</div>
										</div>

										{profileMsg && <div className="text-green-600">{profileMsg}</div>}

										<div className="flex justify-end">
											<button onClick={saveProfile} className="px-4 py-2 bg-purple-600 text-white rounded" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save changes'}</button>
										</div>
									</div>
								</div>
							)}

							{active === 'instructor' && (
								<div>
									<h1 className="text-2xl font-bold mb-4">Instructor Info</h1>
									<div className="space-y-4">
										<div>
											<label className="block text-sm font-medium">Headline</label>
											<input value={headline} onChange={e => setHeadline(e.target.value)} className="mt-1 block w-full rounded border p-2" />
										</div>

										<div>
											<label className="block text-sm font-medium">Credentials / Short bio</label>
											<textarea value={credentials} onChange={e => setCredentials(e.target.value)} className="mt-1 block w-full rounded border p-2" rows={3} />
										</div>

										<div>
											<label className="block text-sm font-medium">Website</label>
											<input value={website} onChange={e => setWebsite(e.target.value)} className="mt-1 block w-full rounded border p-2" />
										</div>

										<div className="flex items-center space-x-4">
											<button onClick={saveInstructor} disabled={instrSaving} className="px-4 py-2 bg-purple-600 text-white rounded">{instrSaving ? 'Saving...' : 'Save Instructor Profile'}</button>
											{instrMsg && <div className="text-sm text-gray-700">{instrMsg}</div>}
										</div>
									</div>
								</div>
							)}

							{active === 'courses' && (
								<div>
									<div className="flex items-center justify-between mb-4">
										<h1 className="text-2xl font-bold">Your Courses</h1>
										<button onClick={startNew} className="px-3 py-2 bg-green-600 text-white rounded">New Course</button>
									</div>

									{loadingCourses ? (
										<div>Loading...</div>
									) : (
										<div className="space-y-4">
											{courses.length === 0 && <div>No courses yet. Create one to get started.</div>}
											{courses.map(c => (
												<div key={c._id} className="border p-4 rounded">
													<div className="flex items-start justify-between">
														<div>
															<div className="text-lg font-semibold">{c.title}</div>
															<div className="text-sm text-gray-600">{c.description?.slice(0, 160)}</div>
															<div className="text-xs text-gray-500 mt-1">{c.accessTier} · {c.status}</div>
														</div>
														<div className="space-x-2">
															<button onClick={() => togglePublish(c)} className="px-3 py-1 bg-yellow-600 text-white rounded">{c.status === 'published' ? 'Unpublish' : 'Publish'}</button>
															<button onClick={() => setEditing(c)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
															<button onClick={() => removeCourse(c._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
														</div>
													</div>
												</div>
											))}
										</div>
									)}

									{editing && (
										<div className="mt-6 border-t pt-4">
											<CourseEditor course={editing} onCancel={() => setEditing(null)} onSave={saveCourse} saving={savingCourse} />
										</div>
									)}
								</div>
							)}

						</div>
					</section>
				</div>
			</main>

			<Footer />
		</div>
	);
}
