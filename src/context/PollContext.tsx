import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Poll, UserVote, PollStatistics } from '../types';
import { INITIAL_POLLS, INITIAL_VOTES } from '../data/mockSeed';
import { supabase } from '../lib/supabase';

interface PollContextType {
  polls: Poll[];
  votes: UserVote[];
  activePoll: Poll | null;
  createClassicPoll: (title: string, question: string, createdBy: string, createdByName: string) => Promise<Poll>;
  createMultiplePoll: (title: string, question: string, options: string[], createdBy: string, createdByName: string) => Promise<Poll>;
  unlockPoll: (pollId: string) => Promise<void>;
  closePoll: (pollId: string) => Promise<void>;
  castVote: (pollId: string, userId: string, option: string) => Promise<{ success: boolean; error?: string }>;
  hasUserVoted: (pollId: string, userId: string) => boolean;
  getUserVote: (pollId: string, userId: string) => UserVote | undefined;
  getPollStatistics: (pollId: string, registeredVotersCount: number, onlineVotersCount: number) => PollStatistics;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [polls, setPolls] = useState<Poll[]>(() => {
    const saved = localStorage.getItem('parlament_polls');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_POLLS;
  });

  const [votes, setVotes] = useState<UserVote[]>(() => {
    const saved = localStorage.getItem('parlament_votes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_VOTES;
  });

  // Fetch polls and votes from Supabase
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pollsError && pollsData) {
        if (pollsData.length > 0) {
          setPolls(pollsData as Poll[]);
          localStorage.setItem('parlament_polls', JSON.stringify(pollsData));
        } else {
          // Auto-seed initial polls to Supabase
          const { error: seedPollsError } = await supabase.from('polls').insert(INITIAL_POLLS);
          if (!seedPollsError) {
            setPolls(INITIAL_POLLS);
            localStorage.setItem('parlament_polls', JSON.stringify(INITIAL_POLLS));
          }
        }
      }

      // 2. Fetch votes
      const { data: votesData, error: votesError } = await supabase
        .from('user_votes')
        .select('*')
        .order('casted_at', { ascending: false });

      if (!votesError && votesData) {
        if (votesData.length > 0) {
          setVotes(votesData as UserVote[]);
          localStorage.setItem('parlament_votes', JSON.stringify(votesData));
        } else {
          // Auto-seed initial votes to Supabase
          const { error: seedVotesError } = await supabase.from('user_votes').insert(INITIAL_VOTES);
          if (!seedVotesError) {
            setVotes(INITIAL_VOTES);
            localStorage.setItem('parlament_votes', JSON.stringify(INITIAL_VOTES));
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch polls/votes failed, using local state:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Supabase Realtime subscription on polls and votes
    const pollsChannel = supabase
      .channel('public:polls_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        (payload) => {
          fetchData();
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Poll;
            if (updated.status === 'active') {
              // Trigger instant student notification
              window.dispatchEvent(
                new CustomEvent('parlament:poll-unlocked', {
                  detail: { pollId: updated.id, poll: updated, timestamp: updated.unlocked_at },
                })
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_votes' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
    };
  }, [fetchData]);

  const activePoll = polls.find((p) => p.status === 'active') || null;

  const createClassicPoll = useCallback(
    async (
      title: string,
      question: string,
      createdBy: string,
      createdByName: string
    ): Promise<Poll> => {
      const newPoll: Poll = {
        id: `poll-${Date.now()}`,
        type: 'classic',
        title: title.trim() || undefined,
        question: question.trim(),
        options: ['ZA', 'PROTIV', 'UZDRŽAN/A'],
        status: 'locked',
        created_by: createdBy,
        created_by_name: createdByName,
        created_at: new Date().toISOString(),
        unlocked_at: null,
        closed_at: null,
      };

      setPolls((prev) => [newPoll, ...prev]);

      try {
        await supabase.from('polls').insert([newPoll]);
      } catch (e) {
        console.warn('Supabase insert poll failed', e);
      }

      return newPoll;
    },
    []
  );

  const createMultiplePoll = useCallback(
    async (
      title: string,
      question: string,
      options: string[],
      createdBy: string,
      createdByName: string
    ): Promise<Poll> => {
      const filteredOptions = options.map((o) => o.trim()).filter(Boolean);
      const newPoll: Poll = {
        id: `poll-${Date.now()}`,
        type: 'multiple',
        title: title.trim() || undefined,
        question: question.trim(),
        options: filteredOptions.length > 0 ? filteredOptions : ['Opcija 1', 'Opcija 2'],
        status: 'locked',
        created_by: createdBy,
        created_by_name: createdByName,
        created_at: new Date().toISOString(),
        unlocked_at: null,
        closed_at: null,
      };

      setPolls((prev) => [newPoll, ...prev]);

      try {
        await supabase.from('polls').insert([newPoll]);
      } catch (e) {
        console.warn('Supabase insert multiple poll failed', e);
      }

      return newPoll;
    },
    []
  );

  const unlockPoll = useCallback(async (pollId: string) => {
    const now = new Date().toISOString();
    let unlockedTarget: Poll | null = null;

    setPolls((prev) =>
      prev.map((p) => {
        if (p.id === pollId) {
          unlockedTarget = { ...p, status: 'active', unlocked_at: now };
          return unlockedTarget;
        }
        if (p.status === 'active') {
          return { ...p, status: 'locked' };
        }
        return p;
      })
    );

    try {
      // First set any previously active poll to locked in Supabase
      await supabase.from('polls').update({ status: 'locked' }).eq('status', 'active');
      // Then unlock target poll
      await supabase.from('polls').update({ status: 'active', unlocked_at: now }).eq('id', pollId);
    } catch (e) {
      console.warn('Supabase unlock poll failed', e);
    }

    // Trigger instant local notification event
    window.dispatchEvent(
      new CustomEvent('parlament:poll-unlocked', {
        detail: { pollId, poll: unlockedTarget, timestamp: now },
      })
    );
    localStorage.setItem(
      'parlament_last_unlocked_event',
      JSON.stringify({ pollId, timestamp: now })
    );
  }, []);

  const closePoll = useCallback(async (pollId: string) => {
    const now = new Date().toISOString();
    setPolls((prev) =>
      prev.map((p) => (p.id === pollId ? { ...p, status: 'closed', closed_at: now } : p))
    );

    try {
      await supabase.from('polls').update({ status: 'closed', closed_at: now }).eq('id', pollId);
    } catch (e) {
      console.warn('Supabase close poll failed', e);
    }
  }, []);

  const hasUserVoted = useCallback(
    (pollId: string, userId: string): boolean => {
      return votes.some((v) => v.poll_id === pollId && v.user_id === userId);
    },
    [votes]
  );

  const getUserVote = useCallback(
    (pollId: string, userId: string): UserVote | undefined => {
      return votes.find((v) => v.poll_id === pollId && v.user_id === userId);
    },
    [votes]
  );

  const castVote = useCallback(
    async (
      pollId: string,
      userId: string,
      option: string
    ): Promise<{ success: boolean; error?: string }> => {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) {
        return { success: false, error: 'Glasanje ne postoji.' };
      }
      if (poll.status !== 'active') {
        return { success: false, error: 'Glasanje trenutno nije otvoreno za članove parlamenta.' };
      }
      if (hasUserVoted(pollId, userId)) {
        return {
          success: false,
          error: 'Već ste evidentirani kao glasač na ovom pitanju. Dvostruko glasanje nije dozvoljeno.',
        };
      }

      const newVote: UserVote = {
        id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        poll_id: pollId,
        user_id: userId,
        selected_option: option,
        casted_at: new Date().toISOString(),
      };

      setVotes((prev) => [newVote, ...prev]);

      try {
        const { error } = await supabase.from('user_votes').insert([newVote]);
        if (error) {
          console.warn('Supabase insert vote error:', error);
          if (error.code === '23505') {
            return { success: false, error: 'Baza je odbila glasački listić: dvostruko glasanje je onemogućeno.' };
          }
        }
      } catch (e) {
        console.warn('Supabase cast vote failed', e);
      }

      return { success: true };
    },
    [polls, hasUserVoted]
  );

  const getPollStatistics = useCallback(
    (
      pollId: string,
      registeredVotersCount: number,
      onlineVotersCount: number
    ): PollStatistics => {
      const poll = polls.find((p) => p.id === pollId);
      const pollVotes = votes.filter((v) => v.poll_id === pollId);
      const totalVotes = pollVotes.length;

      let durationSeconds = 0;
      let durationFormatted = 'Nije započeto';

      if (poll?.unlocked_at) {
        const startTime = new Date(poll.unlocked_at).getTime();
        const endTime = poll.closed_at ? new Date(poll.closed_at).getTime() : Date.now();
        durationSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));

        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        if (minutes > 0) {
          durationFormatted = `${minutes} minuta i ${seconds} sekundi`;
        } else {
          durationFormatted = `${seconds} sekundi`;
        }
      }

      const options = poll?.options || [];
      const results = options.map((opt) => {
        const count = pollVotes.filter((v) => v.selected_option === opt).length;
        const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
        return {
          option: opt,
          count,
          percentage,
        };
      });

      const turnoutPercentage =
        registeredVotersCount > 0
          ? Number(((totalVotes / registeredVotersCount) * 100).toFixed(1))
          : 0;

      return {
        totalVotes,
        registeredVoters: registeredVotersCount,
        onlineVoters: onlineVotersCount,
        turnoutPercentage,
        results,
        durationFormatted,
        durationSeconds,
      };
    },
    [polls, votes]
  );

  return (
    <PollContext.Provider
      value={{
        polls,
        votes,
        activePoll,
        createClassicPoll,
        createMultiplePoll,
        unlockPoll,
        closePoll,
        castVote,
        hasUserVoted,
        getUserVote,
        getPollStatistics,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};
